'use client';

import { useState, useEffect, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { UploadCloud, Sparkles, Download, RefreshCw, Image as ImageIcon, ChevronRight, Loader2, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Image from 'next/image';

type Intensity = 'Subtle' | 'Festive' | 'Mythic';

export default function Page() {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [intensity, setIntensity] = useState<Intensity>('Festive');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [caption, setCaption] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Consulting the oracle...');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      if (typeof window !== 'undefined' && window.aistudio) {
        const keySelected = await window.aistudio.hasSelectedApiKey();
        setHasKey(keySelected);
      } else {
        // Fallback for local development or if aistudio is not injected
        setHasKey(!!process.env.NEXT_PUBLIC_GEMINI_API_KEY);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (typeof window !== 'undefined' && window.aistudio) {
      await window.aistudio.openSelectKey();
      // Assume success to avoid race condition
      setHasKey(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setResultImage(null);
        setCaption(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setResultImage(null);
        setCaption(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const generateImage = async () => {
    if (!imageFile || !imagePreview) return;
    
    setIsGenerating(true);
    setError(null);
    setResultImage(null);
    setCaption(null);

    const loadingMessages = [
      'Consulting the oracle...',
      'Gathering laurel leaves...',
      'Polishing the marble...',
      'Summoning the owls...',
      'Weaving golden threads...',
      'Preparing the festival...',
    ];
    
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      messageIndex = (messageIndex + 1) % loadingMessages.length;
      setLoadingMessage(loadingMessages[messageIndex]);
    }, 2500);

    try {
      // Create a fresh instance right before the call
      const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY });
      
      // Extract base64 data (remove the data:image/jpeg;base64, part)
      const base64Data = imagePreview.split(',')[1];
      const mimeType = imageFile.type;

      let intensityPrompt = '';
      if (intensity === 'Subtle') {
        intensityPrompt = 'Keep the transformation subtle, focusing on elegant lighting, a hint of laurel, and refined classical touches without overwhelming the original subject.';
      } else if (intensity === 'Festive') {
        intensityPrompt = 'Make it a joyous celebration with visible laurel crowns, golden accents, and a warm, festive Roman atmosphere.';
      } else if (intensity === 'Mythic') {
        intensityPrompt = 'Go all out with a dramatic, mythic transformation. Include rich marble textures, prominent owls, shields, glowing golden details, and a majestic, god-like presence.';
      }

      const prompt = `Transform this uploaded image into a Quinquatria celebration portrait inspired by Minerva, Roman art, wisdom, and festival iconography. Preserve the person's identity, pose, and composition while reimagining the styling with classical Roman ceremonial aesthetics, refined golden details, laurel elements, soft marble textures, elegant drapery, symbolic owls, and a sophisticated celebratory atmosphere. ${intensityPrompt}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          }
        }
      });

      let generatedImageUrl = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          generatedImageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
          break;
        }
      }

      if (generatedImageUrl) {
        setResultImage(generatedImageUrl);
        
        // Optionally generate a caption
        try {
          const captionResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Write a short, elegant, and playful 1-sentence caption for a photo that has just been transformed into a Roman Quinquatria festival portrait celebrating Minerva. It should end with "Quinquatrified by qqify."`,
          });
          setCaption(captionResponse.text || "A modern muse steps into ancient Rome. Quinquatrified by qqify.");
        } catch (e) {
          console.error("Caption generation failed", e);
          setCaption("A modern muse steps into ancient Rome. Quinquatrified by qqify.");
        }
      } else {
        throw new Error("No image was returned from the model.");
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred during transformation.');
      if (err.message && err.message.includes("Requested entity was not found")) {
        // Reset key state if it's an API key error
        setHasKey(false);
      }
    } finally {
      clearInterval(messageInterval);
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (resultImage) {
      const a = document.createElement('a');
      a.href = resultImage;
      a.download = `qqify-${intensity.toLowerCase()}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (hasKey === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!hasKey) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-6">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-stone-200">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-10 h-10 text-amber-600" />
          </div>
          <h1 className="font-serif text-4xl font-bold text-stone-900 mb-4">qqify</h1>
          <p className="text-stone-600 mb-8 font-sans">
            Transform your photos into Quinquatria-inspired portraits celebrating Minerva and Roman festival aesthetics.
          </p>
          <button
            onClick={handleSelectKey}
            className="w-full bg-stone-900 text-white rounded-full py-4 px-6 font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
          >
            Connect API Key <ChevronRight className="w-5 h-5" />
          </button>
          <p className="text-xs text-stone-400 mt-6">
            Requires a paid Gemini API key with access to Veo/Imagen models.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-amber-200">
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-stone-200 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-600" />
            <span className="font-serif text-2xl font-bold tracking-tight">qqify</span>
          </div>
          <div className="text-xs font-medium uppercase tracking-widest text-stone-400">
            Quinquatria Festival
          </div>
        </div>
      </header>

      <main className="pt-24 pb-20 px-6 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Left Column: Controls & Upload */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <h1 className="font-serif text-5xl lg:text-6xl font-medium leading-[1.1] mb-4 text-stone-900">
                Become <br/><span className="italic text-amber-700">Mythic.</span>
              </h1>
              <p className="text-stone-600 text-lg">
                Upload a portrait and let AI reimagine you in the style of ancient Roman celebrations of Minerva.
              </p>
            </div>

            <div 
              className={`relative border-2 border-dashed rounded-3xl p-8 text-center transition-all duration-200 ${imagePreview ? 'border-stone-300 bg-white' : 'border-amber-200 bg-amber-50/50 hover:bg-amber-50 cursor-pointer'}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => !imagePreview && fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*" 
                className="hidden" 
              />
              
              {imagePreview ? (
                <div className="relative aspect-[3/4] w-full max-w-sm mx-auto rounded-2xl overflow-hidden shadow-md">
                  <Image 
                    src={imagePreview} 
                    alt="Original" 
                    fill 
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <button 
                    onClick={(e) => { e.stopPropagation(); setImagePreview(null); setImageFile(null); setResultImage(null); }}
                    className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm text-stone-900 p-2 rounded-full shadow-sm hover:bg-white transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center">
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 text-amber-600">
                    <UploadCloud className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-medium text-stone-900 mb-1">Upload a portrait</h3>
                  <p className="text-sm text-stone-500">Drag and drop or click to browse</p>
                </div>
              )}
            </div>

            <AnimatePresence>
              {imagePreview && !resultImage && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6 bg-white p-6 rounded-3xl shadow-sm border border-stone-200"
                >
                  <div>
                    <label className="block text-sm font-medium uppercase tracking-wider text-stone-500 mb-3">
                      Transformation Intensity
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['Subtle', 'Festive', 'Mythic'] as Intensity[]).map((level) => (
                        <button
                          key={level}
                          onClick={() => setIntensity(level)}
                          className={`py-3 px-2 rounded-xl text-sm font-medium transition-all ${intensity === level ? 'bg-amber-100 text-amber-900 border-2 border-amber-300' : 'bg-stone-50 text-stone-600 border-2 border-transparent hover:bg-stone-100'}`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={generateImage}
                    disabled={isGenerating}
                    className="w-full bg-stone-900 text-white rounded-full py-4 px-6 font-medium hover:bg-stone-800 transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {loadingMessage}
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Quinquatrify
                      </>
                    )}
                  </button>
                  
                  {error && (
                    <div className="p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                      {error}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Result */}
          <div className="lg:col-span-7">
            <div className="h-full min-h-[600px] bg-stone-200/50 rounded-[2.5rem] border border-stone-200 p-4 lg:p-8 flex flex-col items-center justify-center relative overflow-hidden">
              
              {!resultImage && !isGenerating && (
                <div className="text-center text-stone-400 flex flex-col items-center">
                  <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                  <p className="font-serif text-xl italic">Your masterpiece awaits...</p>
                </div>
              )}

              {isGenerating && (
                <div className="absolute inset-0 bg-stone-900/5 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                  <div className="w-24 h-24 relative">
                    <div className="absolute inset-0 border-4 border-amber-200 rounded-full animate-ping opacity-75"></div>
                    <div className="absolute inset-2 bg-amber-100 rounded-full flex items-center justify-center shadow-lg">
                      <Sparkles className="w-8 h-8 text-amber-600 animate-pulse" />
                    </div>
                  </div>
                  <p className="mt-8 font-serif text-xl text-stone-800 italic">{loadingMessage}</p>
                </div>
              )}

              <AnimatePresence>
                {resultImage && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-lg mx-auto flex flex-col gap-6"
                  >
                    <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden shadow-2xl ring-1 ring-black/5">
                      <Image 
                        src={resultImage} 
                        alt="Quinquatrified Portrait" 
                        fill 
                        className="object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white text-xs font-medium px-3 py-1.5 rounded-full uppercase tracking-wider">
                        {intensity} Edition
                      </div>
                    </div>

                    {caption && (
                      <div className="bg-white p-6 rounded-2xl shadow-sm border border-stone-200 text-center">
                        <p className="font-serif text-lg text-stone-800 italic leading-relaxed">
                          &quot;{caption}&quot;
                        </p>
                      </div>
                    )}

                    <div className="flex gap-4">
                      <button
                        onClick={() => {
                          setResultImage(null);
                          setCaption(null);
                        }}
                        className="flex-1 bg-white text-stone-900 border border-stone-200 rounded-full py-4 px-6 font-medium hover:bg-stone-50 transition-colors flex items-center justify-center gap-2"
                      >
                        <RefreshCw className="w-5 h-5" />
                        Start Over
                      </button>
                      <button
                        onClick={handleDownload}
                        className="flex-1 bg-amber-600 text-white rounded-full py-4 px-6 font-medium hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-600/20"
                      >
                        <Download className="w-5 h-5" />
                        Save Image
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
