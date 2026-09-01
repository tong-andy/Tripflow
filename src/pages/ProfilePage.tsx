import { Navigate } from 'react-router-dom';

export function ProfilePage() {
  return <Navigate to="/trips?settings=profile" replace />;
}
