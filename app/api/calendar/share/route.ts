import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { Resend } from 'resend'

const MAX_RECIPIENTS = 8
const resendApiKey = process.env.RESEND_API_KEY
const fromEmail = process.env.CALENDAR_FROM_EMAIL || 'FirebirdFit <calendar@firebirdfit.app>'
const defaultAppUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.firebirdfit.app'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
  if (!resendApiKey) {
    return NextResponse.json(
      { error: 'Email service is not configured.' },
      { status: 500 }
    )
  }

  let payload: {
    recipientEmails?: string[]
    note?: string
    rangeStart?: string
    rangeEnd?: string
    userId?: string
  }

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { recipientEmails, note = '', rangeStart, rangeEnd, userId } = payload || {}

  if (!userId) {
    return NextResponse.json({ error: 'Missing user identifier.' }, { status: 400 })
  }

  if (!Array.isArray(recipientEmails) || recipientEmails.length === 0) {
    return NextResponse.json({ error: 'Provide at least one recipient email.' }, { status: 400 })
  }

  if (recipientEmails.length > MAX_RECIPIENTS) {
    return NextResponse.json({ error: `You can include up to ${MAX_RECIPIENTS} recipients per email.` }, { status: 400 })
  }

  const sanitizedRecipients = recipientEmails
    .map(email => email?.trim().toLowerCase())
    .filter(Boolean)
  const uniqueRecipients = Array.from(new Set(sanitizedRecipients))

  const invalidEmails = uniqueRecipients.filter(email => !emailRegex.test(email))
  if (invalidEmails.length > 0) {
    return NextResponse.json({ error: `Invalid email(s): ${invalidEmails.join(', ')}` }, { status: 400 })
  }

  try {
    const { data: userProfile, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, full_name, email, role')
      .eq('id', userId)
      .single()

    if (userError || !userProfile) {
      return NextResponse.json({ error: 'Unable to find user profile.' }, { status: 404 })
    }

    if (!['coach', 'assistant_coach', 'athlete'].includes(userProfile.role)) {
      return NextResponse.json({ error: 'You do not have access to share the calendar.' }, { status: 403 })
    }

    const { data: membership, error: membershipError } = await supabaseAdmin
      .from('team_members')
      .select('team_id, teams(name)')
      .eq('user_id', userProfile.id)
      .single()

    if (membershipError || !membership?.team_id) {
      return NextResponse.json({ error: 'You must belong to a team to share its calendar.' }, { status: 400 })
    }

    const teamId = membership.team_id
    const relatedTeam = Array.isArray(membership.teams) ? membership.teams[0] : membership.teams
    const teamName = relatedTeam?.name || 'FirebirdFit Team'

    const requestedStart = rangeStart ? new Date(rangeStart) : new Date()
    const startWindow = Number.isNaN(requestedStart.getTime()) ? new Date() : requestedStart
    const requestedEnd = rangeEnd ? new Date(rangeEnd) : new Date(startWindow.getTime() + 30 * 24 * 60 * 60 * 1000)
    const endWindow = Number.isNaN(requestedEnd.getTime())
      ? new Date(startWindow.getTime() + 30 * 24 * 60 * 60 * 1000)
      : requestedEnd

    const { data: events, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('id, title, start_time, end_time, location, description, event_type')
      .eq('team_id', teamId)
      .gte('start_time', startWindow.toISOString())
      .lte('start_time', endWindow.toISOString())
      .order('start_time', { ascending: true })

    if (eventsError) {
      console.error('Calendar share events error:', eventsError)
      return NextResponse.json({ error: 'Unable to load events for sharing.' }, { status: 500 })
    }

    const eventsHtml = events && events.length > 0
      ? events.map((event) => {
          const startDate = new Date(event.start_time)
          const endDate = new Date(event.end_time)
          const formatter = new Intl.DateTimeFormat('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit'
          })
          return `
            <li style="margin-bottom:16px;">
              <strong>${event.title}</strong><br/>
              <span>${formatter.format(startDate)}${event.location ? ` · ${event.location}` : ''}</span><br/>
              <small>${Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))} min · ${event.event_type}</small>
              ${event.description ? `<p style="margin-top:6px;color:#475569;">${event.description}</p>` : ''}
            </li>
          `
        }).join('')
      : '<p>No events scheduled in the upcoming window.</p>'

    const origin = request.headers.get('origin') || defaultAppUrl
    const calendarUrl = `${origin.replace(/\/$/, '')}/calendar`

    const emailBody = `
      <div style="font-family:Inter,Arial,sans-serif;padding:16px;color:#0f172a;">
        <h2 style="margin-bottom:8px;">${teamName} Calendar Update</h2>
        <p style="margin:0 0 12px 0;">${userProfile.full_name || userProfile.email} shared the latest schedule with you.</p>
        ${note ? `<blockquote style="margin:0 0 16px 0;padding:12px 16px;border-left:4px solid #3b82f6;background:#f8fafc;color:#0f172a;">${note}</blockquote>` : ''}
        <ol style="padding-left:20px;margin:0 0 16px 0;">
          ${eventsHtml}
        </ol>
        <p style="margin:16px 0;">
          View the live calendar anytime: <a href="${calendarUrl}" target="_blank" rel="noopener noreferrer">${calendarUrl}</a>
        </p>
        <p style="margin-top:24px;font-size:12px;color:#64748b;">
          Sent via FirebirdFit. Replies will go directly to ${userProfile.email}.
        </p>
      </div>
    `

    const resend = new Resend(resendApiKey)
    await resend.emails.send({
      from: fromEmail,
      to: [userProfile.email],
      bcc: uniqueRecipients,
      subject: `${teamName} calendar from ${userProfile.full_name || 'your team'}`,
      html: emailBody,
      replyTo: userProfile.email
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Calendar share error:', error)
    return NextResponse.json({ error: 'Unable to send calendar email.' }, { status: 500 })
  }
}

