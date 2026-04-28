import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle2, Calendar, Clock, User, MapPin, Scissors, Loader2, Home } from 'lucide-react'
import { format, parseISO, addMinutes } from 'date-fns'
import { pt } from 'date-fns/locale'

interface BookedApt {
  id: string
  clientName: string
  serviceName: string
  serviceColor: string
  durationMinutes: number
  employeeName: string
  locationName: string
  startsAt: string
  price: number
}

export function BookingConfirmedPage() {
  const { aptId } = useParams<{ aptId: string }>()
  const [apt, setApt]         = useState<BookedApt | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!aptId) return
    fetch(`/api/public/booking/${aptId}`)
      .then(r => r.json())
      .then(data => { setApt(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [aptId])

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )

  if (!apt) return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
      <p className="text-muted-foreground font-body">Marcação não encontrada.</p>
      <Link to="/book" className="text-primary text-sm font-body hover:underline">Nova marcação</Link>
    </div>
  )

  const startDate  = parseISO(apt.startsAt)
  const endTime    = format(addMinutes(startDate, apt.durationMinutes), 'HH:mm')
  const dateLabel  = format(startDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: pt })
  const timeLabel  = `${format(startDate, 'HH:mm')} – ${endTime}`

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-14 border-b border-border flex items-center px-6 gap-3 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
          <Scissors className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="font-display font-bold text-foreground">BarberDesk</span>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md text-center">

          {/* Success icon */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-green-500/10 animate-ping" />
            <div className="relative w-24 h-24 rounded-full bg-green-500/15 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
          </div>

          <h1 className="font-display font-bold text-3xl text-foreground mb-2">
            Marcação confirmada!
          </h1>
          <p className="text-muted-foreground font-body mb-8">
            Olá, <span className="text-foreground font-medium">{apt.clientName}</span>. A sua marcação foi registada com sucesso.
          </p>

          {/* Details card */}
          <div className="rounded-2xl border border-border bg-card text-left overflow-hidden mb-6">
            <div className="flex items-center gap-3 p-4 border-b border-border">
              <div className="w-2.5 h-12 rounded-full flex-shrink-0" style={{ backgroundColor: apt.serviceColor }} />
              <div>
                <p className="font-display font-bold text-foreground text-lg">{apt.serviceName}</p>
                <p className="text-sm text-muted-foreground font-body">{apt.locationName}</p>
              </div>
              <div className="ml-auto">
                <p className="font-display font-bold text-foreground text-xl">{apt.price}€</p>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm font-body text-foreground capitalize">{dateLabel}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm font-body text-foreground">{timeLabel}</span>
                <span className="text-xs text-muted-foreground font-body">({apt.durationMinutes} min)</span>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm font-body text-foreground">{apt.employeeName}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm font-body text-foreground">{apt.locationName}</span>
              </div>
            </div>
          </div>

          {/* Ref number */}
          <p className="text-xs text-muted-foreground font-body mb-6">
            Referência: <span className="font-mono text-foreground">{apt.id.toUpperCase()}</span>
          </p>

          {/* CTA */}
          <div className="flex flex-col gap-3">
            <Link to="/book"
              className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-display font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
            >
              <Calendar className="w-4 h-4" /> Nova marcação
            </Link>
            <Link to="/"
              className="w-full h-12 rounded-xl border border-border text-foreground font-body font-medium flex items-center justify-center gap-2 hover:bg-muted transition-colors"
            >
              <Home className="w-4 h-4" /> Página inicial
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
