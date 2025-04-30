'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/hooks/use-auth';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// Simple Project interface focusing only on what we need
interface Project {
  id: string;
  title: string;
  description: string;
  ownerName: string;
  status: string;
  progress: number;
  evaluationScore?: number;
  feedback?: string;
}

export default function EvaluatePage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [score, setScore] = useState('');
  const [feedback, setFeedback] = useState('');
  
  const { user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Fetch all projects from Firestore
  useEffect(() => {
    async function fetchProjects() {
      if (user && user?.role !=="teacher") {
        router.push('/');
        return;
      }

      try {
        setLoading(true);
        const projectsCollection = collection(db, 'projects');
        const projectSnapshot = await getDocs(projectsCollection);
        
        const projectsList: Project[] = [];
        projectSnapshot.forEach((doc) => {
          const data = doc.data();
          projectsList.push({
            id: doc.id,
            title: data.title || 'Untitled Project',
            description: data.description || 'No description',
            ownerName: data.ownerName || 'Unknown',
            status: data.status || 'Unknown',
            progress: data.progress || 0,
            evaluationScore: data.evaluationScore,
            feedback: data.feedback
          });
        });
        
        setProjects(projectsList);
        console.log("Fetched projects:", projectsList);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: 'Error',
          description: 'Failed to load projects. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    fetchProjects();
  }, [user, router, toast]);

  // Handle selecting a project to evaluate
  const handleSelectProject = (project: Project) => {
    setSelectedProject(project);
    setScore(project.evaluationScore?.toString() || '');
    setFeedback(project.feedback || '');
  };

  // Submit evaluation to Firestore
  const handleSubmitEvaluation = async () => {
    if (!selectedProject || !user) return;
    
    try {
      const scoreNum = parseInt(score);
      if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
        toast({
          title: 'Invalid Score',
          description: 'Please enter a score between 0 and 100.',
          variant: 'destructive',
        });
        return;
      }
      
      const projectRef = doc(db, 'projects', selectedProject.id);
      await updateDoc(projectRef, {
        evaluationScore: scoreNum,
        feedback: feedback,
        evaluatedBy: user.uid,
        evaluatedAt: Timestamp.now()
      });
      
      // Update local state
      setProjects(projects.map(p => 
        p.id === selectedProject.id 
          ? { ...p, evaluationScore: scoreNum, feedback: feedback }
          : p
      ));
      
      setSelectedProject(null);
      
      toast({
        title: 'Evaluation Submitted',
        description: 'Project has been evaluated successfully.',
      });
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit evaluation. Please try again.',
        variant: 'destructive',
      });
    }
  };


  return (
    <div className="p-8 m-20">
      <h1 className="text-2xl font-bold mb-6">Instructor Evaluation Dashboard</h1>
      
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Projects</h2>
          {projects.length === 0 ? (
            <p>No projects found to evaluate.</p>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => (
                <div 
                  key={project.id} 
                  className="p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSelectProject(project)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{project.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                      <p className="text-sm mt-2">
                        <span className="font-medium">By:</span> {project.ownerName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-muted">
                        {project.status}
                      </span>
                      {project.evaluationScore !== undefined && (
                        <p className="text-sm font-medium mt-1">
                          Score: {project.evaluationScore}/100
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-4">Evaluation Form</h2>
          {selectedProject ? (
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-lg mb-4">
                Evaluating: {selectedProject.title}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Score (0-100)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={score}
                    onChange={(e) => setScore(e.target.value)}
                    placeholder="Enter score"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Feedback
                  </label>
                  <Textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Provide feedback for the student"
                    rows={6}
                  />
                </div>
                
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setSelectedProject(null)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitEvaluation}>
                    Submit Evaluation
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 border rounded-lg bg-muted/50 text-center">
              <p>Select a project from the list to evaluate</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}