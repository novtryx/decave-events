'use client'

import { getAttendeesByRef } from '@/app/actions/events'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import React, { useRef } from 'react'

interface EventData {
  id: number
  title: string
  type: string
  description: string
  venue: string
  visibilty: boolean
  address: string
  eventDate: string
  theme: string
}

interface Attendee {
  id: string
  name: string
  email: string
  paystackId: string
  checkedIn: boolean
  qrCode: string
  amount: string
  ticketType: string
  phone: string
  event: EventData
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-NG', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatAmount(amount: string) {
  return '₦' + Number(amount).toLocaleString('en-NG')
}

function shortId(id: string) {
  return id.slice(-8).toUpperCase()
}

// ─── Download as PDF ─────────────────────────────────────────────────────────

async function downloadPDF(attendees: Attendee[]) {
  const { default: jsPDF } = await import('jspdf')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const gold = [255, 209, 89] as const
  const dark = [17, 17, 17] as const
  const mid = [40, 40, 40] as const
  const muted = [120, 120, 120] as const

  attendees.forEach((a, i) => {
    if (i > 0) doc.addPage()
    const ev = a.event

    // Header band
    doc.setFillColor(...gold)
    doc.rect(0, 0, 210, 52, 'F')

    doc.setFillColor(...dark)
    doc.rect(0, 52, 210, 245, 'F')

    // Event type pill
    doc.setFontSize(8)
    doc.setTextColor(100, 70, 0)
    doc.text(ev.type.toUpperCase(), 15, 16)

    // Event title
    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(26, 16, 0)
    doc.text(ev.title, 15, 30)

    // Venue
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 55, 0)
    doc.text(`${ev.venue} · ${ev.address}`, 15, 42)

    // Date/time
    doc.text(`${formatDate(ev.eventDate)} at ${formatTime(ev.eventDate)}`, 15, 49)

    // Divider
    doc.setDrawColor(40, 40, 40)
    doc.setLineWidth(0.3)
    doc.line(15, 62, 195, 62)

    // Attendee fields
    const fields: [string, string][] = [
      ['Attendee', a.name],
      ['Email', a.email],
      ['Phone', a.phone],
      ['Ticket type', a.ticketType],
      ['Amount paid', formatAmount(a.amount)],
      ['Theme', ev.theme],
    ]

    let y = 74
    fields.forEach(([label, value]) => {
      doc.setFontSize(8)
      doc.setTextColor(...muted)
      doc.text(label.toUpperCase(), 15, y)
      doc.setFontSize(11)
      doc.setTextColor(...([240, 240, 240] as const))
      doc.text(value, 15, y + 6)
      y += 18
    })

    // QR Code
    if (a.qrCode) {
      doc.addImage(a.qrCode, 'PNG', 148, 62, 48, 48)
      doc.setFontSize(7)
      doc.setTextColor(...muted)
      doc.text('Scan at entrance', 157, 114)
    }

    // Bottom strip
    doc.setFillColor(...([30, 30, 30] as const))
    doc.rect(0, 265, 210, 32, 'F')

    doc.setFontSize(8)
    doc.setTextColor(...muted)
    doc.text('Present this ticket at the venue entrance', 15, 277)
    doc.setTextColor(...gold)
    doc.text(`TICKET ID: ${shortId(a.id)}`, 15, 285)
    doc.setTextColor(...muted)
    doc.text(`REF: ${a.paystackId}`, 15, 291)
  })

  doc.save(`tickets-${attendees[0]?.paystackId ?? 'download'}.pdf`)
}

// ─── Share ───────────────────────────────────────────────────────────────────

async function shareTickets(ref: string) {
  const url = window.location.href
  if (navigator.share) {
    await navigator.share({ title: 'My Event Ticket', text: `My ticket ref: ${ref}`, url })
  } else {
    await navigator.clipboard.writeText(url)
  }
}

// ─── Ticket Card ─────────────────────────────────────────────────────────────

function TicketCard({ attendee }: { attendee: Attendee }) {
  const ev = attendee.event
  return (
    <div style={{
      background: '#161616',
      borderRadius: 20,
      overflow: 'hidden',
      border: '1px solid #2a2a2a',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        background: '#FFD159',
        padding: '22px 24px 18px',
        position: 'relative',
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 2,
          textTransform: 'uppercase', color: '#7a5c00', marginBottom: 6,
        }}>
          {ev.type}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: '#0f0a00', lineHeight: 1.2, marginBottom: 6 }}>
          {ev.title}
        </div>
        <div style={{ fontSize: 12, color: '#6b4d00', display: 'flex', gap: 6, alignItems: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
          </svg>
          {ev.venue}, {ev.address}
        </div>

        {/* Ticket type badge */}
        <div style={{
          position: 'absolute', top: 20, right: 20,
          background: '#0f0a0080', color: '#FFD159',
          fontSize: 11, fontWeight: 700, padding: '4px 12px',
          borderRadius: 20, letterSpacing: 1,
        }}>
          {attendee.ticketType}
        </div>
      </div>

      {/* Perforation */}
      <div style={{
        display: 'flex', alignItems: 'center',
        background: '#161616', padding: '0 -1px',
        position: 'relative', height: 20,
      }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#0f0f0f', flexShrink: 0, marginLeft: -10 }} />
        <div style={{
          flex: 1, borderTop: '1.5px dashed #2a2a2a',
          margin: '0 8px',
        }} />
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#0f0f0f', flexShrink: 0, marginRight: -10 }} />
      </div>

      {/* Body */}
      <div style={{ padding: '16px 24px 20px', display: 'flex', gap: 16 }}>
        {/* Info */}
        <div style={{ flex: 1 }}>
          <Row label="Date" value={formatDate(ev.eventDate)} />
          <Row label="Time" value={formatTime(ev.eventDate)} />
          <Row label="Attendee" value={attendee.name} />
          <Row label="Phone" value={attendee.phone} />
          <Row label="Amount" value={formatAmount(attendee.amount)} gold />
          {ev.theme && <Row label="Theme" value={ev.theme} />}
        </div>

        {/* QR */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{
            background: '#fff', borderRadius: 10, padding: 6,
            width: 80, height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {attendee.qrCode
              ? <img src={attendee.qrCode} alt="QR" style={{ width: 68, height: 68 }} />
              : <div style={{ width: 68, height: 68, background: '#eee', borderRadius: 6 }} />
            }
          </div>
          <span style={{ fontSize: 10, color: '#444', letterSpacing: 0.5 }}>scan at gate</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid #222',
        padding: '10px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#111',
      }}>
        <div>
          <div style={{ fontSize: 11, color: '#555', letterSpacing: 1 }}>TICKET ID</div>
          <div style={{ fontSize: 12, color: '#FFD159', fontFamily: 'monospace', letterSpacing: 1 }}>
            {shortId(attendee.id)}
          </div>
        </div>
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: attendee.checkedIn ? '#22c55e' : '#555',
          boxShadow: attendee.checkedIn ? '0 0 8px #22c55e80' : 'none',
        }} />
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: '#555', letterSpacing: 1 }}>REF</div>
          <div style={{ fontSize: 10, color: '#444', fontFamily: 'monospace' }}>
            {attendee.paystackId.slice(-12)}
          </div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, gold }: { label: string; value: string; gold?: boolean }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 10, color: '#444', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, color: gold ? '#FFD159' : '#ccc', fontWeight: gold ? 600 : 400 }}>
        {value}
      </div>
    </div>
  )
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{
      background: '#161616', borderRadius: 20, overflow: 'hidden',
      border: '1px solid #1e1e1e', animation: 'pulse 1.5s ease-in-out infinite',
    }}>
      <div style={{ background: '#222', height: 110 }} />
      <div style={{ padding: '20px 24px' }}>
        {[80, 60, 90, 50].map((w, i) => (
          <div key={i} style={{
            height: 12, background: '#222', borderRadius: 6,
            width: `${w}%`, marginBottom: 14,
          }} />
        ))}
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function TicketSuccessPage() {
  const searchParams = useSearchParams()
  const ref = searchParams.get('trxref') ?? searchParams.get('reference') ?? ''
  const shareRef = useRef<HTMLButtonElement>(null)

  const { data: attendees, isLoading, error } = useQuery<Attendee[]>({
  queryKey: ['attendees', ref],
  queryFn: () => getAttendeesByRef(ref),
  enabled: !!ref,
  staleTime: 0,
  gcTime: 0,
})
  const event = attendees?.[0]?.event

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #0f0f0f;
          min-height: 100vh;
        }

        .page {
          background: #0f0f0f;
          min-height: 100vh;
          padding: 48px 16px 80px;
          font-family: 'DM Sans', sans-serif;
          color: #f0f0f0;
          max-width: 680px;
          margin: 0 auto;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .fade-up {
          animation: fadeUp 0.5s ease forwards;
        }

        .btn {
          display: flex; align-items: center; justify-content: center; gap: 8px;
          padding: 13px 24px; border-radius: 12px; border: none;
          font-size: 14px; font-weight: 600; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: transform 0.15s, opacity 0.15s;
          flex: 1;
        }

        .btn:hover { opacity: 0.88; }
        .btn:active { transform: scale(0.97); }

        .btn-primary { background: #FFD159; color: #1a1000; }
        .btn-outline {
          background: transparent;
          border: 1px solid #2a2a2a;
          color: #999;
        }

        .btn-outline:hover { border-color: #444; color: #ccc; }
      `}</style>

      <div className="page">

        {/* ── Success banner ── */}
        {!isLoading && !error && (
          <div className="fade-up" style={{ textAlign: 'center', marginBottom: 40 }}>

            {/* Check icon */}
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: '#FFD159', display: 'flex', alignItems: 'center',
              justifyContent: 'center', margin: '0 auto 18px',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
                stroke="#1a1000" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>

            <h1 style={{
              fontSize: 26, fontWeight: 700, color: '#FFD159', marginBottom: 8,
            }}>
              You&apos;re going to {event?.title ?? 'the event'}!
            </h1>

            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, maxWidth: 380, margin: '0 auto' }}>
              Your payment was successful and your {(attendees?.length ?? 0) > 1 ? 'tickets are' : 'ticket is'} confirmed.
            </p>

            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.7, maxWidth: 380, margin: '0 auto' }}>
             Please REFRESH this page if u dont see the QR CODE and also take a SCREENSHOT of the tickets.
            </p>

             <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: '#161616', border: '1px solid #FFD15930',
              borderRadius: 12, padding: '12px 16px',
              maxWidth: 420, margin: '20px auto 0', textAlign: 'left',
            }}>

              <span style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>
                             Please REFRESH this page if u dont see the QR CODE and also take a SCREENSHOT of the tickets.

              </span>
            </div>
          </div>
        )}

            {/* Email notice */}
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              background: '#161616', border: '1px solid #FFD15930',
              borderRadius: 12, padding: '12px 16px',
              maxWidth: 420, margin: '20px auto 0', textAlign: 'left',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                stroke="#FFD159" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <polyline points="2,4 12,13 22,4" />
              </svg>
              <span style={{ fontSize: 13, color: '#888', lineHeight: 1.6 }}>
                A copy of your ticket{(attendees?.length ?? 0) > 1 ? 's' : ''} has been sent to your email.
                You can also <strong style={{ color: '#ccc' }}>screenshot this page</strong> and present it at the entrance.
              </span>
            </div>
          
        

        {/* ── Loading ── */}
        {isLoading && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                border: '2px solid #222', borderTopColor: '#FFD159',
                animation: 'spin 0.8s linear infinite', margin: '0 auto 12px',
              }} />
              <p style={{ color: '#444', fontSize: 14 }}>Loading your tickets…</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Skeleton /><Skeleton />
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <div style={{
            textAlign: 'center', padding: '60px 20px', color: '#555',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚠</div>
            <p style={{ fontSize: 16, marginBottom: 6 }}>Could not load your tickets</p>
            <p style={{ fontSize: 13, color: '#444' }}>
              Check your email for the confirmation, or contact support with ref: <br />
              <code style={{ color: '#FFD159', fontFamily: 'DM Mono, monospace' }}>{ref}</code>
            </p>
          </div>
        )}

        {/* ── Ticket cards ── */}
        {attendees && attendees.length > 0 && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 32 }}>
              {attendees.map((a, i) => (
                <div key={a.id} className="fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                  <TicketCard attendee={a} />
                </div>
              ))}
            </div>

            {/* ── Action buttons ── */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
              <button
                className="btn btn-primary"
                onClick={() => downloadPDF(attendees)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download PDF
              </button>

              <button
                ref={shareRef}
                className="btn btn-outline"
                onClick={async () => {
                  await shareTickets(ref)
                  if (shareRef.current) {
                    shareRef.current.textContent = 'Link copied!'
                    setTimeout(() => {
                      if (shareRef.current) shareRef.current.textContent = 'Share tickets'
                    }, 2000)
                  }
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
                  <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
                </svg>
                Share tickets
              </button>
            </div>

            {/* ── Hint ── */}
            <p style={{
              textAlign: 'center', fontSize: 12, color: '#333', lineHeight: 1.6,
            }}>
              Screenshot this page · Show QR code at the entrance · Enjoy the event
            </p>
          </>
        )}
      </div>
    </>
  )
}