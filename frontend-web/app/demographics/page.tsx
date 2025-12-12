"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/contexts/session-context";
import { sessionAPI } from "@/lib/api";
import { ProgressHeader } from "@/components/layout/progress-header";
import { Footer } from "@/components/layout/footer";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { useBackNavigation } from "@/hooks/use-back-navigation";
import { SessionEndModal } from "@/components/modals/session-end-modal";
import { NumericKeypad } from "@/components/ui/numeric-keypad";
import { useNumericKeypad } from "@/hooks/use-numeric-keypad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  User,
  Heart,
  ArrowLeft,
  ArrowRight,
  Fingerprint,
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle,
} from "lucide-react";

export default function DemographicsPage() {
  const router = useRouter();
  const { sessionId, setCurrentStep } = useSession();
  const [loading, setLoading] = useState(false);

  const { showModal, handleConfirm, handleCancel } = useBackNavigation(true);

  const [formData, setFormData] = useState({
    age: "",
    weight: "",
    height: "",
    gender: "male",
    blood_type: "O", // Optional in UI, keeping default
    sleep_hours: "",
    had_alcohol_last_24h: false,
    ate_before_donation: false,
    ate_fatty_food: false,
    recent_tattoo_or_piercing: false,
    has_chronic_condition: false,
    condition_controlled: true,
    last_donation_date: "",
  });

  const [willingToDonate, setWillingToDonate] = useState<boolean | null>(null);

  // Calculate BMI automatically
  const calculateBMI = () => {
    const weight = parseFloat(formData.weight);
    const height = parseFloat(formData.height);
    if (weight > 0 && height > 0) {
      const heightInMeters = height / 100;
      return (weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi: number, age: number) => {
    if (age < 18) {
      return null; // No classification for minors
    }
    if (bmi < 18.5) return { label: 'Underweight', color: 'blue' };
    if (bmi < 25) return { label: 'Normal', color: 'green' };
    if (bmi < 30) return { label: 'Overweight', color: 'amber' };
    return { label: 'Above typical range', color: 'orange' };
  };

  const bmiValue = calculateBMI();
  const age = parseInt(formData.age);
  const bmiCategory = bmiValue && age ? getBMICategory(parseFloat(bmiValue), age) : null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!formData.age || !formData.weight || !formData.height) {
      alert("Please fill out age, weight, and height.");
      return;
    }

    /*
    if (willingToDonate === null) {
      alert("Please indicate if you are willing to donate blood.");
      return;
    }
    */

    setLoading(true);
    try {
      if (sessionId) {
        await sessionAPI.submitDemographics(sessionId, {
            age: parseInt(formData.age),
            weight_kg: parseFloat(formData.weight),
            height_cm: parseFloat(formData.height),
            gender: formData.gender,
        });
      } else {
        // Fallback for demo without session
        console.warn("No active session ID, skipping API submission");
      }
      
      setCurrentStep(3); // Moving to scan page (step 3)
      router.push("/scan");
    } catch (err) {
      console.error("Failed to submit demographics:", err);
      // alert("Failed to save information. Please try again.");
      // Fallback navigation
      router.push("/scan");
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    // Create a synthetic event
    const event = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(event);
  };

  const handleBack = () => {
    router.back();
  };

  const handleClearForm = () => {
    setFormData({
      age: "",
      weight: "",
      height: "",
      gender: "male",
      blood_type: "O",
      sleep_hours: "",
      had_alcohol_last_24h: false,
      ate_before_donation: false,
      ate_fatty_food: false,
      recent_tattoo_or_piercing: false,
      has_chronic_condition: false,
      condition_controlled: true,
      last_donation_date: "",
    });
    setWillingToDonate(null);
  };

  const [activeKeypadName, setActiveKeypadName] = useState<string | null>(null);

  // Numeric Keypad for Age
  const ageKeypad = useNumericKeypad({
    onValueChange: (value) => {
      setFormData(prev => ({ ...prev, age: value }));
      // Optional: don't close automatically if you want them to keep typing, 
      // but usually done button closes it.
    },
    allowDecimal: false,
    maxLength: 3,
    min: 1,
    max: 120,
  });

  // Numeric Keypad for Weight
  const weightKeypad = useNumericKeypad({
    onValueChange: (value) => {
      setFormData(prev => ({ ...prev, weight: value }));
    },
    allowDecimal: true,
    maxLength: 6,
    min: 20,
    max: 300,
  });

  // Numeric Keypad for Height
  const heightKeypad = useNumericKeypad({
    onValueChange: (value) => {
      setFormData(prev => ({ ...prev, height: value }));
    },
    allowDecimal: true,
    maxLength: 6,
    min: 50,
    max: 250,
  });

  // Numeric Keypad for Sleep Hours
  const sleepKeypad = useNumericKeypad({
    onValueChange: (value) => {
      setFormData(prev => ({ ...prev, sleep_hours: value }));
    },
    allowDecimal: true,
    maxLength: 4,
    min: 0,
    max: 24,
  });

  // Handle opening keypads with state tracking
  const openKeypad = (name: string, hook: any, initialValue: string) => {
    // Close others first? Not strictly necessary if we only render based on activeKeypadName
    setActiveKeypadName(name);
    hook.open(name, initialValue);
  };
  
  const closeKeypad = (hook: any) => {
    hook.close();
    setActiveKeypadName(null);
  };

  const isBasicInfoComplete = formData.age && formData.weight && formData.height && formData.gender;
  const willingToDonateValue = willingToDonate === null ? "" : willingToDonate === true ? "yes" : "no";

  return (
    <ProtectedRoute requireSession={true} requiredStep={2}>
    <>
      <SessionEndModal 
        isOpen={showModal}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    <div className="h-screen bg-white flex flex-col">
      <main className="flex-1 w-full page-container flex flex-col overflow-y-auto">
        <ProgressHeader 
          currentStep={2}
          totalSteps={4}
          title="Tell Us a Bit About You"
          subtitle="These details help personalize your fingerprint-based health insights. Nothing here identifies you personally."
          accentColor="#00c2cb"
        />

        <form onSubmit={handleSubmit} className="flex-1 pb-2 overflow-hidden flex flex-col">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 flex-1 overflow-hidden">
            {/* Left column - Basic Info and Blood Donation Interest */}
            <div className={`lg:col-span-3 flex flex-col gap-2 transition-opacity duration-300 ${activeKeypadName ? 'opacity-40 grayscale-[0.3] pointer-events-none' : 'opacity-100'}`}>
              {/* Basic Information Card */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-slate-100 hover:shadow-md transition-shadow flex-1 overflow-auto">
                <div className="flex items-start mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center mr-3 flex-shrink-0">
                    <User className="h-5 w-5 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-800 leading-tight">Your Health Context</h2>
                    <p className="text-teal-600 text-lg font-semibold leading-tight">
                      Used to support screening context
                    </p>
                    <p className="text-slate-500 text-base leading-relaxed mt-1">
                      Every person is unique. These basics help us interpret dermatoglyphic patterns more meaningfully.
                    </p>
                  </div>
                  {isBasicInfoComplete && (
                    <div className="flex-shrink-0 ml-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-6 w-6 text-green-600" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Row 1: Age, Weight, Height */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="age" className="text-lg font-semibold text-slate-700 flex items-center gap-1.5">
                        <span className="text-base">🎂</span>
                        <span>Age</span>
                      </Label>
                      <span className="text-red-500 text-sm">*</span>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                        title="Helps us understand age-related health patterns"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <Input
                      id="age"
                      name="age"
                      type="text"
                      inputMode="none"
                      placeholder="e.g., 25"
                      value={formData.age}
                      onFocus={() => openKeypad("age", ageKeypad, formData.age)}
                      readOnly
                      required
                      className={`h-10 text-sm font-medium rounded-lg border-2 transition-all duration-200 cursor-pointer ${activeKeypadName === 'age' ? 'border-teal-500 ring-2 ring-teal-100 bg-teal-50' : formData.age ? 'border-green-400 bg-green-50 text-green-700' : 'border-slate-300 bg-white hover:border-teal-400'}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="weight" className="text-lg font-semibold text-slate-700 flex items-center gap-1.5">
                        <span className="text-base">⚖️</span>
                        <span>Weight (kg)</span>
                      </Label>
                      <span className="text-red-500 text-sm">*</span>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                        title="Used to support general health screening"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <Input
                      id="weight"
                      name="weight"
                      type="text"
                      inputMode="none"
                      placeholder="e.g., 65.5"
                      value={formData.weight}
                      onFocus={() => openKeypad("weight", weightKeypad, formData.weight)}
                      readOnly
                      required
                      className={`h-10 text-sm font-medium rounded-lg border-2 transition-all duration-200 cursor-pointer ${activeKeypadName === 'weight' ? 'border-teal-500 ring-2 ring-teal-100 bg-teal-50' : formData.weight ? 'border-green-400 bg-green-50 text-green-700' : 'border-slate-300 bg-white hover:border-teal-400'}`}
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="height" className="text-lg font-semibold text-slate-700 flex items-center gap-1.5">
                        <span className="text-base">📏</span>
                        <span>Height (cm)</span>
                      </Label>
                      <span className="text-red-500 text-sm">*</span>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                        title="Helps contextualize general health indicators"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <Input
                      id="height"
                      name="height"
                      type="text"
                      inputMode="none"
                      placeholder="e.g., 170"
                      value={formData.height}
                      onFocus={() => openKeypad("height", heightKeypad, formData.height)}
                      readOnly
                      required
                      className={`h-10 text-sm font-medium rounded-lg border-2 transition-all duration-200 cursor-pointer ${activeKeypadName === 'height' ? 'border-teal-500 ring-2 ring-teal-100 bg-teal-50' : formData.height ? 'border-green-400 bg-green-50 text-green-700' : 'border-slate-300 bg-white hover:border-teal-400'}`}
                    />
                  </div>
                </div>

                {/* Row 2: Gender, Blood Type, and BMI */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5">
                      <Label htmlFor="gender" className="text-lg font-semibold text-slate-700 flex items-center gap-1.5">
                        <span className="text-base">🚻</span>
                        <span>Gender</span>
                      </Label>
                      <span className="text-red-500 text-sm">*</span>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                        title="Some health risks vary due to biological factors"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <Select
                      name="gender"
                      value={formData.gender}
                      onValueChange={(val) => handleSelectChange("gender", val)}
                    >
                      <SelectTrigger className="h-11 w-full text-sm font-medium rounded-lg border-2 border-slate-300 hover:border-teal-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 bg-white transition-all flex items-center justify-between px-3">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-2 border-slate-200">
                        <SelectItem value="male" className="cursor-pointer">Male</SelectItem>
                        <SelectItem value="female" className="cursor-pointer">Female</SelectItem>
                        <SelectItem value="prefer_not_say" className="cursor-pointer">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="blood-type" className="text-lg font-semibold text-slate-700 flex items-center gap-1.5">
                        <span className="text-base">🩸</span>
                        <span>Blood Type</span>
                      </Label>
                      <span className="text-slate-400 text-xs">(Optional)</span>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                        title="If known, helps us compare predictions with actual blood type"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    <Select 
                      name="blood_type"
                      value={formData.blood_type} 
                      onValueChange={(val) => handleSelectChange("blood_type", val)}
                    >
                      <SelectTrigger className="h-11 w-full text-sm font-medium rounded-lg border-2 border-slate-300 hover:border-teal-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 bg-white transition-all flex items-center justify-between px-3">
                        <SelectValue placeholder="Select if known" />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-2 border-slate-200">
                        <SelectItem value="unknown" className="cursor-pointer">Unknown</SelectItem>
                        <SelectItem value="O" className="cursor-pointer">O</SelectItem>
                        <SelectItem value="A" className="cursor-pointer">A</SelectItem>
                        <SelectItem value="B" className="cursor-pointer">B</SelectItem>
                        <SelectItem value="AB" className="cursor-pointer">AB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* BMI Display */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label className="text-lg font-semibold text-slate-700 flex items-center gap-1.5">
                        <span className="text-base">📊</span>
                        <span>BMI</span>
                      </Label>
                      <button
                        type="button"
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                        title="Body Mass Index - calculated from height and weight"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                    {bmiValue ? (
                      <div className="h-11 rounded-lg border-2 border-slate-200 bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-between px-3">
                        <span className="text-xl font-black text-teal-600">{bmiValue}</span>
                        {bmiCategory && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            bmiCategory.color === 'green' ? 'bg-green-100 text-green-700' :
                            bmiCategory.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                            bmiCategory.color === 'amber' ? 'bg-amber-100 text-amber-700' :
                            'bg-orange-100 text-orange-700'
                          }`}>
                            {bmiCategory.label}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="h-11 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center">
                        <span className="text-xs text-slate-400 italic">Enter height & weight</span>
                      </div>
                    )}
                    {bmiValue && (
                      <p className="text-xs text-slate-400 italic">
                        {age >= 18 ? 'WHO adult guideline' : 'For reference only'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Blood Donation Interest Card */}
              <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex items-start mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl flex items-center justify-center mr-3 flex-shrink-0">
                    <Heart className="h-5 w-5 text-red-500" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-800 leading-tight mb-1">Blood Donation Awareness</h2>
                    <p className="text-slate-500 text-base leading-relaxed">Optional eligibility guidance</p>
                  </div>
                </div>

                <div>
                  <Label className="text-lg font-medium text-slate-700 mb-2 block leading-relaxed">
                    Would you like to learn whether you may be eligible to donate blood based on general guidelines?
                  </Label>
                  <RadioGroup 
                    value={willingToDonateValue} 
                    onValueChange={(value) => setWillingToDonate(value === "yes")} 
                    className="space-y-2"
                  >
                    <div className="flex items-center p-3 rounded-xl bg-white border-2 border-slate-200 cursor-pointer transition-all hover:border-teal-300 hover:bg-teal-50/30 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50 has-[:checked]:shadow-sm">
                      <RadioGroupItem value="yes" id="yes" className="border-slate-300 data-[state=checked]:border-teal-500 data-[state=checked]:bg-teal-500" />
                      <Label htmlFor="yes" className="text-lg font-medium text-slate-700 cursor-pointer ml-3 flex items-center gap-1.5 flex-1">
                        <span className="text-base">❤️</span>
                        <span>Yes, I'd like to learn about blood donation eligibility</span>
                      </Label>
                    </div>

                    <div className="flex items-center p-3 rounded-xl bg-white border-2 border-slate-200 cursor-pointer transition-all hover:border-slate-300 hover:bg-slate-50 has-[:checked]:border-slate-400 has-[:checked]:bg-slate-50 has-[:checked]:shadow-sm">
                      <RadioGroupItem value="no" id="no" className="border-slate-300 data-[state=checked]:border-slate-500 data-[state=checked]:bg-slate-500" />
                      <Label htmlFor="no" className="text-lg font-medium text-slate-700 cursor-pointer ml-3 flex-1">
                        No, skip this section
                      </Label>
                    </div>
                  </RadioGroup>
                  <p className="text-base text-slate-500 mt-2 leading-relaxed">
                    💡 This is optional and does not affect your health screening results.
                  </p>
                </div>
              </div>
            </div>

            {/* Right column - Keypad OR Info Cards */}
            <div className="lg:col-span-2 min-h-[300px]">
              {activeKeypadName ? (
                 <div className="h-full min-h-[300px] animate-in fade-in duration-300">
                    {/* Render appropriate keypad based on name */}
                    {activeKeypadName === 'age' && (
                      <NumericKeypad
                        variant="inline"
                        isOpen={true}
                        value={ageKeypad.value}
                        error={ageKeypad.error}
                        onKeyPress={ageKeypad.handleKeyPress}
                        onBackspace={ageKeypad.handleBackspace}
                        onDone={() => { ageKeypad.handleDone(); closeKeypad(ageKeypad); }}
                        onClose={() => closeKeypad(ageKeypad)}
                        allowDecimal={false}
                        title="Enter Age"
                        placeholder="Age..."
                      />
                    )}
                    {activeKeypadName === 'weight' && (
                       <NumericKeypad
                        variant="inline"
                        isOpen={true}
                        value={weightKeypad.value}
                        error={weightKeypad.error}
                        onKeyPress={weightKeypad.handleKeyPress}
                        onBackspace={weightKeypad.handleBackspace}
                        onDone={() => { weightKeypad.handleDone(); closeKeypad(weightKeypad); }}
                        onClose={() => closeKeypad(weightKeypad)}
                        allowDecimal={true}
                        title="Enter Weight (kg)"
                        placeholder="0.0 kg"
                      />
                    )}
                    {activeKeypadName === 'height' && (
                       <NumericKeypad
                        variant="inline"
                        isOpen={true}
                        value={heightKeypad.value}
                        error={heightKeypad.error}
                        onKeyPress={heightKeypad.handleKeyPress}
                        onBackspace={heightKeypad.handleBackspace}
                        onDone={() => { heightKeypad.handleDone(); closeKeypad(heightKeypad); }}
                        onClose={() => closeKeypad(heightKeypad)}
                        allowDecimal={true}
                        title="Enter Height (cm)"
                        placeholder="0.0 cm"
                      />
                    )}
                    {activeKeypadName === 'sleep_hours' && (
                       <NumericKeypad
                        variant="inline"
                        isOpen={true}
                        value={sleepKeypad.value}
                        error={sleepKeypad.error}
                        onKeyPress={sleepKeypad.handleKeyPress}
                        onBackspace={sleepKeypad.handleBackspace}
                        onDone={() => { sleepKeypad.handleDone(); closeKeypad(sleepKeypad); }}
                        onClose={() => closeKeypad(sleepKeypad)}
                        allowDecimal={true}
                        title="Enter sleep hours"
                        placeholder="8.0"
                      />
                    )}
                 </div>
              ) : (
                <div className="animate-in fade-in duration-300">
                {willingToDonate === true && (
                  <div className="bg-white rounded-2xl p-5 shadow-lg border-2 border-teal-100 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center mb-4 pb-3 border-b-2 border-teal-100">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center mr-3 shadow-sm">
                        <Heart className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-800">🩺 Donation Details</h3>
                        <p className="text-slate-600 text-lg">Help us assess eligibility</p>
                      </div>
                    </div>
                    
                    <p className="text-base text-slate-600 mb-3 italic">
                      These quick questions help us provide safe, general blood donation guidance. Your responses are used only for this session.
                    </p>

                    <div className="space-y-3">
                      <div className="space-y-1">
                        <Label htmlFor="sleep-hours" className="text-lg font-semibold text-slate-700 flex items-center">
                          😴 Sleep Hours Last Night
                        </Label>
                        <Input
                          id="sleep-hours"
                          name="sleep_hours"
                          type="text"
                          inputMode="none"
                          placeholder="8"
                          value={formData.sleep_hours}
                          onFocus={() => openKeypad("sleep_hours", sleepKeypad, formData.sleep_hours)}
                          readOnly
                          className={`h-10 text-sm font-semibold rounded-lg border-2 transition-all duration-300 cursor-pointer ${activeKeypadName === 'sleep_hours' ? 'border-teal-500 ring-4 ring-teal-100 bg-teal-50 shadow-lg scale-105' : formData.sleep_hours ? 'border-green-300 bg-green-50' : 'border-slate-200 bg-white hover:border-teal-300 hover:shadow-md'}`}
                        />
                        <p className="text-base text-slate-500 italic">Adequate rest helps assess readiness for donation</p>
                      </div>

                      <div className="space-y-1">
                        <Label
                          htmlFor="last-donation"
                          className="text-lg font-semibold text-slate-700 flex items-center"
                        >
                          📅 Last Blood Donation Date
                        </Label>
                        <Input
                          id="last-donation"
                          name="last_donation_date"
                          type="date"
                          value={formData.last_donation_date}
                          onChange={handleChange}
                          className="h-9 text-sm rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-0 bg-slate-50 focus:bg-white transition-all"
                        />
                        <p className="text-base text-slate-500 italic">Used to follow standard donation interval guidelines</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-lg font-semibold text-slate-700">🧬 Health & Lifestyle:</Label>
                        <p className="text-base text-slate-500 italic mb-2">Check all that apply</p>
                        <div className="grid grid-cols-1 gap-2 text-base">
                          {/* Checkboxes for lifestyle */}
                          {[
                            { id: "had_alcohol_last_24h", label: "I had alcohol in the last 24 hours" },
                            { id: "ate_before_donation", label: "I ate fatty food before donation" },
                            { id: "ate_fatty_food", label: "I had a tattoo or piercing recently" },
                            { id: "recent_tattoo_or_piercing", label: "I have a chronic condition" },
                          ].map((item) => (
                            <div key={item.id} className="flex items-start space-x-2 bg-slate-50 p-2 rounded-md hover:bg-slate-100 transition-all">
                              <Checkbox
                                id={item.id}
                                checked={formData[item.id as keyof typeof formData] as boolean}
                                onCheckedChange={(checked) => 
                                  setFormData(prev => ({ ...prev, [item.id]: !!checked }))
                                }
                                className="border-blue-400 data-[state=checked]:bg-blue-500 h-4 w-4 mt-0.5"
                              />
                              <Label htmlFor={item.id} className="text-base text-slate-700 cursor-pointer leading-tight flex-1">
                                {item.label}
                              </Label>
                            </div>
                          ))}
                        </div>
                        <p className="text-base text-slate-400 italic mt-2">
                          ℹ️ These questions do not replace official donor screening
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {(willingToDonate === false || willingToDonate === null) && (
                  <div className="bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 rounded-2xl p-3 shadow-lg border-2 border-teal-200 hover:shadow-xl transition-shadow duration-300">
                    <div className="flex items-center mb-2 pb-2 border-b-2 border-teal-200">
                      <div className="w-8 h-8 bg-gradient-to-br from-teal-100 to-teal-200 rounded-xl flex items-center justify-center mr-2 shadow-sm">
                        <Fingerprint className="h-4 w-4 text-teal-600" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-800 leading-tight">🔍 What Happens Next</h3>
                        <p className="text-slate-600 text-xs leading-tight">Your analysis journey</p>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="bg-white/80 rounded-md p-2">
                        <p className="text-xs text-slate-600 leading-tight flex items-start">
                          <CheckCircle className="h-3.5 w-3.5 text-teal-500 inline mr-1.5 flex-shrink-0 mt-0.5" />
                          <span>Our AI will analyze your fingerprint patterns using dermatoglyphic research</span>
                        </p>
                      </div>

                      <div className="bg-white/80 rounded-md p-3">
                        <p className="text-xs text-slate-600 leading-tight flex items-start">
                          <Heart className="h-4 w-4 text-red-500 inline mr-2 flex-shrink-0 mt-0.5" />
                          <span>You'll receive personalized health insights and recommendations</span>
                        </p>
                      </div>

                      <div className="bg-white/80 rounded-md p-3">
                        <p className="text-xs text-slate-600 leading-tight flex items-start">
                          <User className="h-4 w-4 text-blue-500 inline mr-2 flex-shrink-0 mt-0.5" />
                          <span>Your data is processed securely and never stored permanently</span>
                        </p>
                      </div>

                      <Alert className="border-teal-200 bg-teal-50 py-2 px-3">
                        <AlertTriangle className="h-4 w-4 text-teal-600" />
                        <AlertDescription className="text-teal-800 text-xs">
                          ⚠️ For educational purposes only. Always consult healthcare professionals.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </div>
                )}
                </div>
              )}
            </div>
          </div>
        </form>

        <div className="flex justify-between items-center mt-2 pb-2">
          <Button 
            variant="outline" 
            onClick={handleBack} 
            className="flex items-center gap-2 px-6 py-2.5 h-10 rounded-md"
          >
            <ArrowLeft size={16} />
            Back
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleClearForm}
            className="px-6 py-2.5 h-10 text-red-600 border-red-300 hover:bg-red-50 text-sm rounded-md bg-transparent"
          >
            Clear Fields
          </Button>

          <div className="flex flex-col items-end">
            <Button 
              onClick={handleNext}
              disabled={!isBasicInfoComplete || loading}
              className="flex items-center gap-2 px-6 py-2 h-11 rounded-xl bg-[#00c2cb] hover:bg-[#00a8b0] text-white font-bold text-sm shadow-lg"
            >
              Continue to Fingerprint Scan
              <ArrowRight size={18} />
            </Button>
            <p className="text-xs mt-1 text-gray-500">
              Takes less than 1 minute • No needles • Non-invasive
            </p>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400">
              <span>🛡️</span>
              <span>Your privacy is always protected</span>
            </div>
          </div>
        </div>
      </main>

      <Footer fixed={true} />

    </div>
    </>
    </ProtectedRoute>
  );
}
