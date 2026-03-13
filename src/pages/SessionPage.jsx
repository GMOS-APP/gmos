import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { BookOpen, Swords, FileText, Loader2, Printer } from 'lucide-react';
import PrepTab from '@/components/session/PrepTab';
import { printSessionPrep } from '@/utils/printSessionPrep';
import RunTab from '@/components/session/RunTab';
import SessionDebrief from '@/components/session/SessionDebrief';
import SessionHeader from '@/components/session/SessionHeader';

export default function SessionPage() {
  const params = new URLSearchParams(window.location.search);
  const campaignId = params.get('id') || params.get('campaign_id');
  const sessionId = params.get('session_id');
  const isNewSession = params.get('new') === 'true';
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('prep');
  const [debriefStarted, setDebriefStarted] = useState(false);

  const { data: campaign } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => base44.entities.Campaign.filter({ id: campaignId }),
    enabled: !!campaignId,
    select: (d) => d?.[0],
  });

  const sessionNum = campaign?.current_session_number || 0;

  const { data: session } = useQuery({
    queryKey: ['session', sessionId || `${campaignId}-${sessionNum}`],
    queryFn: () => sessionId
      ? base44.entities.Session.filter({ id: sessionId })
      : base44.entities.Session.filter({ campaign_id: campaignId, session_number: sessionNum }),
    enabled: !!campaignId && !isNewSession,
    select: (d) => d?.[0],
  });

  const { data: previousSession } = useQuery({
    queryKey: ['prev-session', campaignId, sessionNum],
    queryFn: () => base44.entities.Session.filter(
      { campaign_id: campaignId, session_number: sessionNum - 1 },
      '-session_number', 1
    ),
    enabled: !!campaignId && sessionNum > 1,
    select: (d) => d?.[0],
  });

  const { data: entities = [] } = useQuery({
    queryKey: ['entities', campaignId],
    queryFn: () => base44.entities.WorldEntity.filter({ campaign_id: campaignId }, '-updated_date', 200),
    enabled: !!campaignId,
  });

  const { data: notes = [], refetch: refetchNotes } = useQuery({
    queryKey: ['quick-notes', campaignId, session?.id],
    queryFn: () => base44.entities.QuickNote.filter(
      { campaign_id: campaignId, session_id: session?.id },
      '-created_date', 50
    ),
    enabled: !!campaignId && !!session?.id,
  });

  useEffect(() => {
    if (session) {
      setFormData({
        title: session.title || '',
        previous_session_recap: session.previous_session_recap ||
          (previousSession ? (previousSession.next_session_primer || previousSession.summary || '') : ''),
        strong_start: session.strong_start || '',
        planned_encounters: session.planned_encounters || [],
        creature_ids: session.creature_ids || [],
        planned_locations: session.planned_locations || [],
        npc_ids: session.npc_ids || [],
        npc_notes: session.npc_notes || '',
        monster_notes: session.monster_notes || '',
        location_notes: session.location_notes || '',
        rumors: session.rumors || '',
        treasure_notes: session.treasure_notes || '',
      });
    } else if (!sessionId && previousSession) {
      setFormData(prev => ({
        ...prev,
        previous_session_recap: previousSession.next_session_primer || previousSession.summary || '',
      }));
    }
  }, [session?.id, previousSession?.id, sessionId]);

  const addNoteMutation = useMutation({
    mutationFn: (content) => base44.entities.QuickNote.create({
      campaign_id: campaignId,
      session_id: session?.id,
      content,
      processed: false,
    }),
    onSuccess: () => refetchNotes(),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (session) {
        return base44.entities.Session.update(session.id, formData);
      }
      const created = await base44.entities.Session.create({
        campaign_id: campaignId,
        session_number: sessionNum + 1,
        status: 'planned',
        ...formData,
      });
      await base44.entities.Campaign.update(campaignId, { current_session_number: sessionNum + 1 });
      return created;
    },
    onSuccess: () => {
      setSaved(true);
      queryClient.invalidateQueries();
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSave = async () => {
    setSaving(true);
    await saveMutation.mutateAsync();
    setSaving(false);
  };

  const isRunMode = session?.status === 'in_progress';

  // Auto-switch to Run tab when session goes live
  useEffect(() => {
    if (isRunMode && activeTab === 'prep') setActiveTab('run');
  }, [isRunMode]);

  return (
    <div className={activeTab === 'run' ? "h-full flex flex-col" : "min-h-full flex flex-col"}>

      <SessionHeader
        formData={formData}
        setFormData={setFormData}
        saving={saving}
        saved={saved}
        handleSave={handleSave}
        session={session}
        isRunMode={isRunMode}
        campaignId={campaignId}
        sessionNum={sessionNum}
      />

      <div className={activeTab === 'run' ? "flex-1 overflow-hidden flex flex-col min-h-0" : "flex flex-col"}>
        <Tabs defaultValue="prep" value={activeTab} onValueChange={setActiveTab} className={activeTab === 'run' ? "flex-1 flex flex-col overflow-hidden min-h-0" : "flex flex-col"}>
          <div className="px-4 pt-3 pb-3 dark:border-b dark:border-zinc-800/40 border-b border-gray-200 flex-shrink-0">
            <TabsList className="dark:bg-zinc-900 dark:border dark:border-zinc-800 bg-gray-100 border border-gray-300">
              <TabsTrigger value="prep" className="text-xs gap-1.5">
                <BookOpen className="w-3.5 h-3.5" /> Prep
              </TabsTrigger>
              <TabsTrigger value="run" className="text-xs gap-1.5">
                <Swords className="w-3.5 h-3.5" /> Run
                {isRunMode && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />}
              </TabsTrigger>
              <TabsTrigger value="debrief" className="text-xs gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Debrief
              </TabsTrigger>
            </TabsList>
          </div>

          {/* PREP */}
          <TabsContent value="prep" className="m-0">
            <div className="p-4 lg:p-6">
              <div className="flex justify-end mb-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => printSessionPrep(session, formData, entities)}
                  className="dark:border-zinc-700 dark:text-zinc-400 text-xs gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print Prep Sheet
                </Button>
              </div>
              <PrepTab
                session={session}
                campaign={campaign}
                entities={entities}
                formData={formData}
                setFormData={setFormData}
                campaignId={campaignId}
              />
            </div>
          </TabsContent>

          {/* RUN */}
          <TabsContent value="run" className="flex-1 flex overflow-hidden m-0">
            <RunTab
              session={session}
              notes={notes}
              entities={entities}
              campaignId={campaignId}
              onAddNote={(content) => addNoteMutation.mutate(content)}
              isAddingNote={addNoteMutation.isPending}
            />
          </TabsContent>

          {/* DEBRIEF */}
          <TabsContent value="debrief" className="flex-1 overflow-y-auto m-0">
            {(debriefStarted || session?.status === 'completed' || session?.status === 'debriefed') ? (
              <SessionDebrief
                session={session}
                notes={notes}
                entities={entities}
                campaignId={campaignId}
              />
            ) : (
              <div className="p-6 flex flex-col items-center justify-center gap-4 min-h-64">
                <FileText className="w-10 h-10 dark:text-zinc-600 text-gray-400" />
                <div className="text-center">
                  <p className="text-sm font-semibold dark:text-zinc-300 text-gray-900">Ready to debrief?</p>
                  <p className="text-xs dark:text-zinc-600 text-gray-600 mt-1">Process your session notes and update your world.</p>
                </div>
                <Button
                  onClick={async () => {
                    setSaving(true);
                    try {
                      let targetSession = session;
                      if (!targetSession) {
                        targetSession = await base44.entities.Session.create({
                          campaign_id: campaignId,
                          session_number: sessionNum + 1,
                          status: 'completed',
                          end_time: new Date().toISOString(),
                          ...formData,
                        });
                        await base44.entities.Campaign.update(campaignId, { current_session_number: sessionNum + 1, active_mode: 'debrief' });
                      } else {
                        await base44.entities.Session.update(targetSession.id, { status: 'completed', end_time: new Date().toISOString() });
                        await base44.entities.Campaign.update(campaignId, { active_mode: 'debrief' });
                      }
                      queryClient.invalidateQueries();
                      setDebriefStarted(true);
                    } finally {
                      setSaving(false);
                    }
                  }}
                  disabled={saving}
                  className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold"
                >
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileText className="w-4 h-4 mr-2" />}
                  End & Debrief
                </Button>
              </div>
            )}
          </TabsContent>

        </Tabs>
      </div>

    </div>
  );
}