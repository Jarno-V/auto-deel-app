import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Car } from "lucide-react";
import { Button } from "./ui/button";
import { saveUser, getUser } from "../utils/storage";
import type { User } from "../types";

export function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    // Als er al een gebruiker is ingelogd, ga naar dashboard
    const existingUser = getUser();
    if (existingUser) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleSelectUser = (user: User) => {
    saveUser(user);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-6">
            <Car className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl mb-2">Auto Planner</h1>
          <p className="text-gray-600">Wie ben jij?</p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={() => handleSelectUser("Jarno")}
            className="w-full h-20 text-xl bg-blue-600 hover:bg-blue-700"
          >
            IK BEN JARNO
          </Button>
          <Button
            onClick={() => handleSelectUser("Sven")}
            className="w-full h-20 text-xl bg-green-600 hover:bg-green-700"
          >
            IK BEN SVEN
          </Button>
        </div>
      </div>
    </div>
  );
}
