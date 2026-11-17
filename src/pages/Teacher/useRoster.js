import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { getProfileById } from '../../services/profileService'

/** The signed-in teacher/parent's students ({ _id, name, avatar }). */
export default function useRoster() {
  const { user } = useAuth()
  const [roster, setRoster] = useState([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    if (!user?.profile) return
    setLoading(true)
    try {
      const profile = await getProfileById(user.profile)
      setRoster(
        (profile?.students || [])
          .map((s) => ({ _id: s._id, name: s.name, avatar: s.avatar }))
          .sort((a, b) => a.name.localeCompare(b.name))
      )
    } finally {
      setLoading(false)
    }
  }, [user?.profile])

  useEffect(() => {
    reload()
  }, [reload])

  return { roster, loading, reload }
}
