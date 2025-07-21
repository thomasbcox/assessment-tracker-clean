'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Users, UserPlus, Search, User, Crown, UserCheck, Clock, CheckCircle } from 'lucide-react';
import { sessionManager } from '@/lib/session';

interface TeamMember {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  assessmentStatus?: 'completed' | 'pending' | 'not_started';
  lastAssessmentDate?: string;
}

interface TeamStructure {
  myManager: TeamMember | null;
  mySubordinates: TeamMember[];
  allTeamMembers: TeamMember[];
}

export default function TeamPage() {
  const { addToast } = useToast();
  const [teamStructure, setTeamStructure] = useState<TeamStructure | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [periods, setPeriods] = useState<Array<{ id: number; name: string }>>([]);

  const currentUser = sessionManager.getUser();

  useEffect(() => {
    if (currentUser) {
      loadTeamData();
    }
  }, [currentUser]);

  const loadTeamData = async () => {
    try {
      // Load assessment periods first
      const periodsRes = await fetch('/api/assessment-periods');
      if (periodsRes.ok) {
        const periodsData = await periodsRes.json();
        setPeriods(periodsData);
        // Set the first active period as default
        const activePeriod = periodsData.find((p: any) => p.isActive);
        setSelectedPeriod(activePeriod?.id || periodsData[0]?.id);
      }

      // Load team structure
      const [usersRes, relationshipsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/manager-relationships')
      ]);

      if (usersRes.ok && relationshipsRes.ok) {
        const users = await usersRes.json();
        const relationships = await relationshipsRes.json();
        
        // Build team structure
        const structure = buildTeamStructure(users, relationships, currentUser!.id);
        setTeamStructure(structure);
      } else {
        addToast({ message: 'Failed to load team data', type: 'error' });
      }
    } catch (error) {
      console.error('Error loading team data:', error);
      addToast({ message: 'Failed to load team data', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const buildTeamStructure = (users: TeamMember[], relationships: any[], currentUserId: string) => {
    const currentUser = users.find(u => u.id === currentUserId);
    if (!currentUser) return null;

    // Find current user's manager
    const myManagerRelationship = relationships.find(r => r.subordinateId === currentUserId);
    const myManager = myManagerRelationship 
      ? users.find(u => u.id === myManagerRelationship.managerId) || null
      : null;

    // Find current user's subordinates
    const mySubordinateRelationships = relationships.filter(r => r.managerId === currentUserId);
    const mySubordinates = mySubordinateRelationships.map(r => 
      users.find(u => u.id === r.subordinateId)
    ).filter(Boolean) as TeamMember[];

    // Get all team members (manager + subordinates + self)
    const allTeamMembers = [currentUser, myManager, ...mySubordinates].filter(Boolean) as TeamMember[];

    return {
      myManager,
      mySubordinates,
      allTeamMembers
    };
  };

  const getDisplayName = (user: TeamMember) => {
    const fullName = `${user.firstName} ${user.lastName}`.trim();
    return fullName || user.email;
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
              case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'manager': return 'Manager';
      default: return 'Team Member';
    }
  };

  const getAssessmentStatusIcon = (status?: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      default:
        return <User className="w-4 h-4 text-gray-400" />;
    }
  };

  const filteredTeamMembers = teamStructure?.allTeamMembers.filter(member => 
    !searchTerm || 
    getDisplayName(member).toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  if (!currentUser) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-brand-dark-blue mb-4">Access Denied</h2>
          <p className="text-brand-dark-blue/70">You don't have permission to access this page.</p>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-dark-blue"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-brand-dark-blue">My Team</h1>
            <p className="text-brand-dark-blue/70 mt-2">
              View your team structure and member information
            </p>
          </div>
                        {(currentUser.role === 'admin' || currentUser.role === 'super_admin') && (
            <Button
              onClick={() => window.location.href = '/dashboard/admin'}
              className="bg-brand-dark-blue text-white hover:bg-brand-dark-blue/90"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Admin Panel
            </Button>
          )}
        </div>

        {/* Team Structure Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* My Manager */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Crown className="w-5 h-5 text-brand-dark-blue" />
                My Manager
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teamStructure?.myManager ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-brand-dark-blue/10 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-brand-dark-blue" />
                    </div>
                    <div>
                      <p className="font-semibold text-brand-dark-blue">
                        {getDisplayName(teamStructure.myManager)}
                      </p>
                      <p className="text-sm text-brand-dark-blue/70">
                        {getRoleDisplay(teamStructure.myManager.role)}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-brand-dark-blue/60">
                    {teamStructure.myManager.email}
                  </p>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <User className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No manager assigned</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Subordinates */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-dark-blue" />
                                 My Team
                 {teamStructure?.mySubordinates && teamStructure.mySubordinates.length > 0 && (
                   <span className="text-sm bg-brand-dark-blue text-white px-2 py-1 rounded-full">
                     {teamStructure.mySubordinates.length}
                   </span>
                 )}
              </CardTitle>
            </CardHeader>
            <CardContent>
                             {teamStructure?.mySubordinates && teamStructure.mySubordinates.length > 0 ? (
                 <div className="space-y-3">
                   {teamStructure.mySubordinates.slice(0, 3).map(member => (
                    <div key={member.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-dark-blue/10 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-brand-dark-blue" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-brand-dark-blue truncate">
                          {getDisplayName(member)}
                        </p>
                        <p className="text-xs text-brand-dark-blue/60 truncate">
                          {member.email}
                        </p>
                      </div>
                    </div>
                  ))}
                                     {teamStructure?.mySubordinates && teamStructure.mySubordinates.length > 3 && (
                     <p className="text-sm text-brand-dark-blue/60 text-center">
                       +{teamStructure.mySubordinates.length - 3} more
                     </p>
                   )}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No team members</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Team Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                                 <div className="flex items-center justify-between">
                   <span className="text-sm text-brand-dark-blue/70">Total Members</span>
                   <span className="font-semibold text-brand-dark-blue">
                     {teamStructure?.allTeamMembers?.length || 0}
                   </span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-sm text-brand-dark-blue/70">Managers</span>
                   <span className="font-semibold text-brand-dark-blue">
                     {teamStructure?.allTeamMembers?.filter(m => m.role === 'manager').length || 0}
                   </span>
                 </div>
                 <div className="flex items-center justify-between">
                   <span className="text-sm text-brand-dark-blue/70">Team Members</span>
                   <span className="font-semibold text-brand-dark-blue">
                     {teamStructure?.allTeamMembers?.filter(m => m.role === 'user').length || 0}
                   </span>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Members List */}
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">All Team Members</CardTitle>
                <CardDescription>View detailed information about your team</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search team members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredTeamMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-dark-blue/10 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-brand-dark-blue" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-brand-dark-blue">
                          {getDisplayName(member)}
                        </p>
                        {member.id === currentUser.id && (
                          <span className="text-xs bg-brand-dark-blue text-white px-2 py-1 rounded-full">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-brand-dark-blue/70">{member.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {getRoleDisplay(member.role)}
                        </span>
                        {member.assessmentStatus && (
                          <div className="flex items-center gap-1">
                            {getAssessmentStatusIcon(member.assessmentStatus)}
                            <span className="text-xs text-gray-600 capitalize">
                              {member.assessmentStatus}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {member.assessmentStatus === 'completed' && (
                      <UserCheck className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                </div>
              ))}

              {filteredTeamMembers.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No team members found</p>
                  <p className="text-sm">
                    {searchTerm ? 'Try adjusting your search terms' : 'Your team structure will appear here'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
} 