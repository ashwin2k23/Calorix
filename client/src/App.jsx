import { Routes, Route } from 'react-router-dom';
import { SignIn, SignUp, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground selection:bg-primary/30">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route 
          path="/sign-in/*" 
          element={
            <div className="flex items-center justify-center min-h-screen bg-background">
              <SignIn routing="path" path="/sign-in" />
            </div>
          } 
        />
        <Route 
          path="/sign-up/*" 
          element={
            <div className="flex items-center justify-center min-h-screen bg-background">
              <SignUp routing="path" path="/sign-up" />
            </div>
          } 
        />
        <Route 
          path="/dashboard/*" 
          element={
            <>
              <SignedIn>
                <Dashboard />
              </SignedIn>
              <SignedOut>
                <RedirectToSignIn />
              </SignedOut>
            </>
          } 
        />
      </Routes>
    </div>
  );
}

export default App;
