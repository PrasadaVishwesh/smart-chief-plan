import { useState } from "react";
import { Recipe } from "@/types/recipe";
import { Dialog, DialogContent } from "./ui/dialog";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { ScrollArea } from "./ui/scroll-area";
import { useCookMode, formatTime } from "@/hooks/useCookMode";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Timer,
  RefreshCw,
  X,
  CheckCircle2,
  Plus,
  Trash2,
  ChefHat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface CookModeModalProps {
  recipe: Recipe | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QuickTimerButtons = [1, 3, 5, 10, 15, 20, 30];

const CookModeModal = ({ recipe, open, onOpenChange }: CookModeModalProps) => {
  const { toast } = useToast();
  const [showTimerPanel, setShowTimerPanel] = useState(false);

  const {
    currentStep,
    totalSteps,
    isActive,
    isSpeaking,
    voiceEnabled,
    timers,
    suggestedTime,
    setVoiceEnabled,
    startCookMode,
    exitCookMode,
    nextStep,
    previousStep,
    repeatStep,
    stopSpeaking,
    addTimer,
    removeTimer,
    toggleTimer,
  } = useCookMode({
    instructions: recipe?.instructions || [],
    onComplete: () => {
      toast({
        title: "🎉 Cooking Complete!",
        description: `You've successfully cooked ${recipe?.name}!`,
      });
    },
  });

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      exitCookMode();
    }
    onOpenChange(isOpen);
  };

  const handleStart = () => {
    startCookMode();
  };

  const handleExit = () => {
    exitCookMode();
    onOpenChange(false);
  };

  if (!recipe) return null;

  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl h-[90vh] p-0 overflow-hidden bg-background flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 p-4 border-b bg-primary text-primary-foreground">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ChefHat className="w-6 h-6" />
              <div>
                <h2 className="font-bold text-lg">Cook Mode</h2>
                <p className="text-sm opacity-90">{recipe.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setVoiceEnabled(!voiceEnabled)}
                title={voiceEnabled ? "Mute voice" : "Enable voice"}
              >
                {voiceEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/20"
                onClick={() => setShowTimerPanel(!showTimerPanel)}
              >
                <Timer className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary-foreground hover:bg-primary-foreground/20"
                onClick={handleExit}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {!isActive ? (
          // Start Screen
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <ChefHat className="w-12 h-12 text-primary" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Ready to Cook?</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              Cook Mode will guide you through each step with voice instructions. 
              Keep your hands free while cooking!
            </p>
            <div className="flex flex-col gap-3 text-sm text-muted-foreground mb-8">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-primary" />
                <span>Voice guidance for each step</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="w-4 h-4 text-primary" />
                <span>Built-in cooking timers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>Track your progress</span>
              </div>
            </div>
            <Button size="lg" onClick={handleStart} className="gap-2">
              <Play className="w-5 h-5" />
              Start Cooking
            </Button>
          </div>
        ) : (
          // Active Cook Mode
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Progress Bar */}
            <div className="flex-shrink-0 p-4 border-b">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="font-medium">Step {currentStep + 1} of {totalSteps}</span>
                <span className="text-muted-foreground">{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Timer Panel (Slide Down) */}
            {showTimerPanel && (
              <div className="flex-shrink-0 p-4 border-b bg-muted/30 animate-fade-in">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm">Timers</h4>
                  {suggestedTime && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addTimer(suggestedTime, `Step ${currentStep + 1}`)}
                      className="gap-1 text-xs"
                    >
                      <Plus className="w-3 h-3" />
                      Add {suggestedTime}min (suggested)
                    </Button>
                  )}
                </div>
                
                {/* Quick Timer Buttons */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {QuickTimerButtons.map((mins) => (
                    <Button
                      key={mins}
                      variant="outline"
                      size="sm"
                      onClick={() => addTimer(mins)}
                      className="text-xs"
                    >
                      {mins}m
                    </Button>
                  ))}
                </div>

                {/* Active Timers */}
                {timers.length > 0 && (
                  <div className="space-y-2">
                    {timers.map((timer) => (
                      <div
                        key={timer.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border",
                          timer.remaining === 0 
                            ? "bg-destructive/10 border-destructive animate-pulse" 
                            : "bg-background"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "text-2xl font-mono font-bold",
                            timer.remaining === 0 ? "text-destructive" : "text-foreground"
                          )}>
                            {formatTime(timer.remaining)}
                          </span>
                          <span className="text-sm text-muted-foreground">{timer.label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {timer.remaining > 0 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleTimer(timer.id)}
                              className="h-8 w-8"
                            >
                              {timer.isRunning ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTimer(timer.id)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {timers.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No active timers. Tap a button above to add one.
                  </p>
                )}
              </div>
            )}

            {/* Current Step */}
            <ScrollArea className="flex-1">
              <div className="p-6">
                {/* Step Indicator */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold shadow-lg">
                    {currentStep + 1}
                  </div>
                  <div className="flex-1">
                    <span className="text-sm text-muted-foreground">Current Step</span>
                    {isSpeaking && (
                      <div className="flex items-center gap-2 text-primary text-sm">
                        <div className="flex gap-1">
                          <span className="w-1 h-3 bg-primary rounded-full animate-pulse" />
                          <span className="w-1 h-3 bg-primary rounded-full animate-pulse delay-75" />
                          <span className="w-1 h-3 bg-primary rounded-full animate-pulse delay-150" />
                        </div>
                        Speaking...
                      </div>
                    )}
                  </div>
                </div>

                {/* Instruction Text */}
                <div className="bg-muted/50 rounded-xl p-6 mb-6">
                  <p className="text-lg leading-relaxed">
                    {recipe.instructions[currentStep]}
                  </p>
                </div>

                {/* Repeat Button */}
                <div className="flex justify-center mb-6">
                  <Button
                    variant="outline"
                    onClick={isSpeaking ? stopSpeaking : repeatStep}
                    className="gap-2"
                  >
                    {isSpeaking ? (
                      <>
                        <VolumeX className="w-4 h-4" />
                        Stop Speaking
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Repeat Step
                      </>
                    )}
                  </Button>
                </div>

                {/* Step Dots */}
                <div className="flex justify-center gap-1.5 flex-wrap">
                  {recipe.instructions.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        if (isSpeaking) stopSpeaking();
                        // Direct navigation
                        const { goToStep } = useCookMode({ instructions: recipe.instructions });
                      }}
                      className={cn(
                        "w-2.5 h-2.5 rounded-full transition-all",
                        index === currentStep 
                          ? "bg-primary w-6" 
                          : index < currentStep 
                            ? "bg-primary/60" 
                            : "bg-muted-foreground/30"
                      )}
                      title={`Step ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            </ScrollArea>

            {/* Navigation Footer */}
            <div className="flex-shrink-0 p-4 border-t bg-background">
              <div className="flex items-center justify-between gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={previousStep}
                  disabled={currentStep === 0}
                  className="flex-1 gap-2"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </Button>
                <Button
                  size="lg"
                  onClick={nextStep}
                  className="flex-1 gap-2"
                >
                  {currentStep === totalSteps - 1 ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Finish
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CookModeModal;
