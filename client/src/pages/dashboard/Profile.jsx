import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useClerk } from '@clerk/clerk-react';

export default function Profile({ profile, user }) {
  const { signOut } = useClerk();

  const handleEditProfile = () => {
    localStorage.removeItem('calorix_profile');
    window.location.href = '#/onboarding';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">User Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and fitness metrics.</p>
        </div>
        <Button variant="outline" onClick={handleEditProfile} className="border-white/10">Edit Metrics</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1 border-white/5 bg-card/40 backdrop-blur-md">
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <img 
              src={user?.imageUrl} 
              alt="Profile" 
              className="w-24 h-24 rounded-full border-4 border-primary/20 mb-4"
            />
            <h2 className="text-xl font-bold">{user?.fullName || 'User'}</h2>
            <p className="text-sm text-muted-foreground mb-6">{user?.primaryEmailAddress?.emailAddress}</p>
            <Button onClick={() => signOut()} variant="destructive" className="w-full">Sign Out</Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 border-white/5 bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
              <div>
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="text-lg font-medium">{profile?.age} years</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="text-lg font-medium">{profile?.gender}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Height</p>
                <p className="text-lg font-medium">{profile?.height} cm</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Weight</p>
                <p className="text-lg font-medium">{profile?.weight} kg</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Activity Level</p>
                <p className="text-lg font-medium">{profile?.activity_level}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dietary Preference</p>
                <p className="text-lg font-medium">{profile?.diet_preference}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-3 border-white/5 bg-card/40 backdrop-blur-md">
          <CardHeader>
            <CardTitle>Fitness Goals & Targets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Goal</p>
                <p className="text-lg font-bold text-primary">{profile?.goal_type}</p>
              </div>
              <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Daily Calories</p>
                <p className="text-lg font-bold text-[#00c2ff]">{profile?.calorie_target} kcal</p>
              </div>
              <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Protein Target</p>
                <p className="text-lg font-bold text-[#9b6dff]">{profile?.protein_target}g</p>
              </div>
              <div className="p-4 rounded-xl bg-black/20 border border-white/5 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Hydration</p>
                <p className="text-lg font-bold text-blue-400">{profile?.hydration_target / 1000}L</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
