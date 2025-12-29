"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ProgressHeader } from "@/components/layout/progress-header";
import { Footer } from "@/components/layout/footer";
import {
  Heart,
  MapPin,
  ArrowLeft,
  Phone,
  Globe,
  Facebook,
  Mail,
} from "lucide-react";
import { useSession } from "@/contexts/session-context";
import { STEPS } from "@/lib/constants";

interface BloodCenter {
  name: string;
  address: string;
  phone?: string;
  google_query: string;
}

interface StoredData {
  blood_centers?: BloodCenter[];
  willing_to_donate?: boolean;
}

const decodeBase64Json = (encoded: string) => {
  try {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    return JSON.parse(decoded);
  } catch (err) {
    console.error("Failed to decode stored session data", err);
    return null;
  }
};

export default function BloodCentersPage() {
  const router = useRouter();
  const { sessionId } = useSession();
  const [loading, setLoading] = useState(true);
  const [centers, setCenters] = useState<BloodCenter[]>([]);
  const [willing, setWilling] = useState(false);
  // No filters/search on blood centers page per requirements

  useEffect(() => {
    const load = () => {
      const activeSessionId =
        sessionId || sessionStorage.getItem("current_session_id");
      if (!activeSessionId) {
        setLoading(false);
        return;
      }
      const encoded = sessionStorage.getItem(activeSessionId);
      if (!encoded) {
        setLoading(false);
        return;
      }
      const dataWithExpiry = decodeBase64Json(encoded) as {
        data: StoredData;
      } | null;
      if (!dataWithExpiry) {
        setLoading(false);
        return;
      }
      const d = dataWithExpiry.data;
      if (d?.blood_centers) setCenters(d.blood_centers);
      setWilling(!!d?.willing_to_donate || (d?.blood_centers?.length ?? 0) > 0);
      setLoading(false);
    };
    load();
  }, [sessionId]);

  // Show all centers

  return (
    <ProtectedRoute requireSession={true} requiredStep={STEPS.SCAN}>
      <div className="h-screen bg-white flex flex-col overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden select-none">
          <div className="flex flex-col px-28 py-6 overflow-hidden">
            <ProgressHeader
              currentStep={4}
              totalSteps={4}
              title="Blood Donation Centers"
              subtitle="Full list based on your choice to donate"
              accentColor="#f43f5e"
            />
            {/* Bottom Back Button */}
            <div className="mb-2">
              <button
                onClick={() => router.push("/results")}
                className="inline-flex items-center text-sm font-semibold text-red-700 hover:text-red-800 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Results
              </button>
            </div>

            <div className="flex-1 bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-y-auto p-5">
              {loading ? (
                <p className="text-sm text-gray-600">
                  Loading blood centers...
                </p>
              ) : !willing ? (
                <p className="text-sm text-gray-600">
                  Blood donation centers are hidden because you chose not to
                  donate.
                </p>
              ) : centers.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No blood donation centers available.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {centers.map((center, idx) => (
                    <div
                      key={`${center.name}-${idx}`}
                      className="bg-linear-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-4 hover:shadow-lg transition-shadow"
                    >
                      <h4 className="font-bold text-lg text-gray-900 mb-2 flex items-center">
                        <Heart className="w-5 h-5 mr-2 text-red-500" />
                        {center.name}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3 flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {center.address}
                      </p>

                      {(center as any).website && (
                        <div className="mb-2">
                          <a
                            href={(center as any).website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-blue-700 underline break-all"
                          >
                            {(center as any).website}
                          </a>
                        </div>
                      )}

                      {/* Contact Info */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(center as any).type && (
                          <span className="inline-flex items-center px-2 py-1 bg-gray-200 text-gray-800 rounded-md text-xs font-medium">
                            {(center as any).type}
                          </span>
                        )}
                        {(center as any).phone && (
                          <span className="inline-flex items-center px-2 py-1 bg-green-600 text-white rounded-md text-xs font-medium">
                            <Phone className="w-3 h-3 mr-1" />{" "}
                            {(center as any).phone}
                          </span>
                        )}
                        {Array.isArray((center as any).mobile) &&
                          (center as any).mobile.map((m: string, i: number) => (
                            <span
                              key={i}
                              className="inline-flex items-center px-2 py-1 bg-emerald-600 text-white rounded-md text-xs font-medium"
                            >
                              <Phone className="w-3 h-3 mr-1" /> {m}
                            </span>
                          ))}
                        {(center as any).email && (
                          <a
                            href={`mailto:${(center as any).email}`}
                            className="inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded-md text-xs font-medium"
                          >
                            <Mail className="w-3 h-3 mr-1" />{" "}
                            {(center as any).email}
                          </a>
                        )}
                        {(center as any).website && (
                          <a
                            href={(center as any).website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2 py-1 bg-cyan-600 text-white rounded-md text-xs font-medium break-all"
                          >
                            <Globe className="w-3 h-3 mr-1" />{" "}
                            {(center as any).website}
                          </a>
                        )}
                        {(center as any).facebook && (
                          <a
                            href={(center as any).facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-2 py-1 bg-indigo-600 text-white rounded-md text-xs font-medium"
                          >
                            <Facebook className="w-3 h-3 mr-1" />{" "}
                            {(center as any).facebook}
                          </a>
                        )}
                      </div>

                      <div className="mb-3 rounded-lg overflow-hidden border-2 border-gray-300">
                        <iframe
                          src={`https://www.google.com/maps?q=${encodeURIComponent(
                            center.google_query
                          )}&output=embed`}
                          width="100%"
                          height="200"
                          style={{ border: 0 }}
                          loading="lazy"
                          title={center.name}
                        ></iframe>
                      </div>

                      <div className="flex gap-3">
                        {(center as any).phone && (
                          <a
                            href={`tel:${(center as any).phone}`}
                            className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                          >
                            📞 {(center as any).phone}
                          </a>
                        )}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            center.google_query
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          View on Map
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Footer fixed={true} />
        </main>
      </div>
    </ProtectedRoute>
  );
}
