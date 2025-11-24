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
    teamId?: string
  }

  try {
    payload = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  const { recipientEmails, note = '', rangeStart, rangeEnd, userId, teamId } = payload || {}

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

    // Get team membership - use selected team if provided, otherwise get first team
    let membership: any = null
    let finalTeamId: string | null = null
    let teamName = 'FirebirdFit Team'

    if (teamId) {
      // Use the provided teamId to get specific team membership
      const { data: membershipData, error: membershipError } = await supabaseAdmin
        .from('team_members')
        .select('team_id, teams(name)')
        .eq('user_id', userProfile.id)
        .eq('team_id', teamId)
        .single()

      if (membershipError || !membershipData?.team_id) {
        return NextResponse.json({ error: 'You must belong to the selected team to share its calendar.' }, { status: 400 })
      }

      membership = membershipData
      finalTeamId = membership.team_id
      const relatedTeam = Array.isArray(membership.teams) ? membership.teams[0] : membership.teams
      teamName = relatedTeam?.name || 'FirebirdFit Team'
    } else {
      // Fallback: get first team if no teamId provided
      const { data: memberships, error: membershipError } = await supabaseAdmin
        .from('team_members')
        .select('team_id, teams(name)')
        .eq('user_id', userProfile.id)
        .limit(1)

      if (membershipError || !memberships || memberships.length === 0) {
        return NextResponse.json({ error: 'You must belong to a team to share its calendar.' }, { status: 400 })
      }

      membership = memberships[0]
      finalTeamId = membership.team_id
      const relatedTeam = Array.isArray(membership.teams) ? membership.teams[0] : membership.teams
      teamName = relatedTeam?.name || 'FirebirdFit Team'
    }

    const requestedStart = rangeStart ? new Date(rangeStart) : new Date()
    const startWindow = Number.isNaN(requestedStart.getTime()) ? new Date() : requestedStart
    const requestedEnd = rangeEnd ? new Date(rangeEnd) : new Date(startWindow.getTime() + 30 * 24 * 60 * 60 * 1000)
    const endWindow = Number.isNaN(requestedEnd.getTime())
      ? new Date(startWindow.getTime() + 30 * 24 * 60 * 60 * 1000)
      : requestedEnd

    const { data: events, error: eventsError } = await supabaseAdmin
      .from('events')
      .select('id, title, start_time, end_time, location, description, event_type')
      .eq('team_id', finalTeamId)
      .gte('start_time', startWindow.toISOString())
      .lte('start_time', endWindow.toISOString())
      .order('start_time', { ascending: true })

    if (eventsError) {
      console.error('Calendar share events error:', eventsError)
      return NextResponse.json({ error: 'Unable to load events for sharing.' }, { status: 500 })
    }

    const eventTypeLabels: Record<string, string> = {
      practice: 'Practice',
      game: 'Game',
      meeting: 'Meeting',
      training: 'Training'
    }

    const eventsHtml = events && events.length > 0
      ? events.map((event) => {
          const startDate = new Date(event.start_time)
          const endDate = new Date(event.end_time)
          const dateLabel = startDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
          const timeLabel = `${startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} – ${endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
          const durationMinutes = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60))
          const typeLabel = eventTypeLabels[event.event_type] || 'Event'

          return `
            <li style="margin-bottom:24px;padding:24px;border-radius:24px;border:1px solid #dbeafe;background:linear-gradient(135deg,#eff6ff 0%,#ffffff 100%);box-shadow:0 12px 30px rgba(15,23,42,0.08);list-style:none;">
              <div style="margin-bottom:16px;">
                <span style="display:inline-block;padding:4px 12px;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:10px;">${typeLabel}</span>
                <strong style="display:block;font-size:20px;color:#0f172a;">${event.title}</strong>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:12px;color:#1e293b;font-size:14px;line-height:1.7;margin-bottom:12px;">
                <div style="padding:12px;border-radius:16px;background:#ffffff;border:1px solid #e2e8f0;">
                  <div style="font-size:12px;text-transform:uppercase;color:#94a3b8;font-weight:600;">Date</div>
                  <div style="font-weight:600;">${dateLabel}</div>
                </div>
                <div style="padding:12px;border-radius:16px;background:#ffffff;border:1px solid #e2e8f0;">
                  <div style="font-size:12px;text-transform:uppercase;color:#94a3b8;font-weight:600;">Time</div>
                  <div style="font-weight:600;">${timeLabel}</div>
                </div>
                <div style="padding:12px;border-radius:16px;background:#ffffff;border:1px solid #e2e8f0;">
                  <div style="font-size:12px;text-transform:uppercase;color:#94a3b8;font-weight:600;">Duration</div>
                  <div style="font-weight:600;">${durationMinutes} min</div>
                </div>
                ${event.location ? `
                  <div style="padding:12px;border-radius:16px;background:#ffffff;border:1px solid #e2e8f0;">
                    <div style="font-size:12px;text-transform:uppercase;color:#94a3b8;font-weight:600;">Location</div>
                    <div style="font-weight:600;">${event.location}</div>
                  </div>
                ` : ''}
              </div>
              ${event.description ? `
                <p style="margin-top:12px;padding:16px;border-left:4px solid #3b82f6;background:#eff6ff;color:#1e293b;border-radius:16px;margin-bottom:0;">
                  ${event.description}
                </p>
              ` : ''}
            </li>
          `
        }).join('')
      : '<p style="color:#475569;">No events scheduled in the upcoming window.</p>'

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

