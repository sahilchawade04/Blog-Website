import { useSelector } from 'react-redux'
import { Navigate } from 'react-router-dom'

// eslint-disable-next-line react/prop-types
const ProtectedRoute = ({children}) => {
    const {user} = useSelector(store=>store.auth)
  return (
    <div>
      {
        user ? children:<Navigate to={'/login'}/>
      }
    </div>
  )
}

export default ProtectedRoute
