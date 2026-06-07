import { Navigate, useLocation } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  return (
    <Navigate
      to="/login"
      replace
      state={{ from: location, reason: "not_found" }}
    />
  );
};

export default NotFound;
