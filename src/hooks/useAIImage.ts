import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface UseAIImageReturn {
  aiImageUrl: string | null;
  isGenerating: boolean;
  error: string | null;
  generateImage: (dishName: string, cuisine: string) => Promise<void>;
  clearAIImage: () => void;
}

export const useAIImage = (): UseAIImageReturn => {
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = useCallback(async (dishName: string, cuisine: string) => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const { data, error: fnError } = await supabase.functions.invoke("generate-recipe-image", {
        body: { dishName, cuisine },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.imageUrl) {
        setAiImageUrl(data.imageUrl);
      }
    } catch (err) {
      console.error("AI image generation error:", err);
      setError(err instanceof Error ? err.message : "Failed to generate image");
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const clearAIImage = useCallback(() => {
    setAiImageUrl(null);
    setError(null);
  }, []);

  return {
    aiImageUrl,
    isGenerating,
    error,
    generateImage,
    clearAIImage,
  };
};
