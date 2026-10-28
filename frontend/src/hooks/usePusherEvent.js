import { useEffect, useRef } from 'react'
import { getPusher } from '../services/pusher'

// Subscribe to a Pusher channel/event. Does nothing if Pusher is not configured.
export default function usePusherEvent(channelName, eventName, handler) {
  const ref = useRef(handler)
  ref.current = handler
  useEffect(() => {
    const pusher = getPusher()
    if (!pusher || !channelName) return
    const channel = pusher.subscribe(channelName)
    const cb = (data) => ref.current(data)
    channel.bind(eventName, cb)
    return () => { channel.unbind(eventName, cb); pusher.unsubscribe(channelName) }
  }, [channelName, eventName])
}
