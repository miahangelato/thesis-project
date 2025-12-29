"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { ProgressHeader } from "@/components/layout/progress-header";
import { Footer } from "@/components/layout/footer";
import {
  Hospital,
  MapPin,
  ArrowLeft,
  Phone,
  Globe,
  Facebook,
  Mail,
} from "lucide-react";
import { useSession } from "@/contexts/session-context";
import { STEPS } from "@/lib/constants";

interface Facility {
  name: string;
  address: string;
  phone?: string;
  google_query: string;
}

interface StoredData {
  nearby_facilities?: Facility[];
  demographics?: any;
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

export default function HospitalsPage() {
  const router = useRouter();
  const { sessionId } = useSession();
  const [loading, setLoading] = useState(true);
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [filter, setFilter] = useState<string>("all");

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
      const dataWithExpiry = decodeBase64Json(encoded) as { data: any } | null;
      if (!dataWithExpiry) {
        setLoading(false);
        return;
      }
      const hospitalsDb: Facility[] = dataWithExpiry.data?.hospitals_db || [];
      const laboratoriesDb: Facility[] =
        dataWithExpiry.data?.laboratories_db || [];
      const doctorsDb: Facility[] =
        dataWithExpiry.data?.diabetes_doctors_db || [];
      const nearby: Facility[] = dataWithExpiry.data?.nearby_facilities || [];
      const normalizedLaboratories = laboratoriesDb.map((lab: any) => ({
        ...lab,
        type: lab.type || "Laboratory",
      }));
      const normalizedDoctors = doctorsDb.map((doc: any) => ({
        ...doc,
        type: doc.type || "Doctor",
        address:
          doc.address || doc.clinic || "Clinic details provided upon contact",
      }));
      const merged = [
        ...hospitalsDb,
        ...normalizedLaboratories,
        ...normalizedDoctors,
        ...nearby,
      ];
      setFacilities(merged);
      setLoading(false);
    };
    load();
  }, [sessionId]);

  const filteredFacilities = facilities.filter((f) => {
    const normalizedName = (f.name || "").toLowerCase();
    const normalizedAddress = (f.address || "").toLowerCase();
    if (filter === "all") return true;
    const type = (f as any).type?.toLowerCase() || "";
    if (filter === "hospital")
      return (
        type.includes("hospital") ||
        normalizedName.includes("hospital") ||
        normalizedAddress.includes("hospital")
      );
    if (filter === "laboratory")
      return (
        type.includes("laborator") ||
        type.includes("diagnostic") ||
        normalizedName.includes("laborator") ||
        normalizedName.includes("diagnostic") ||
        normalizedAddress.includes("laborator") ||
        normalizedAddress.includes("diagnostic")
      );
    if (filter === "doctor")
      return (
        type.includes("doctor") ||
        type.includes("physician") ||
        normalizedName.includes("doctor") ||
        normalizedName.includes("dr.")
      );
    return true;
  });

  return (
    <ProtectedRoute requireSession={true} requiredStep={STEPS.SCAN}>
      <div className="h-screen bg-white flex flex-col overflow-hidden">
        <main className="flex-1 flex flex-col overflow-hidden select-none">
          <div className="flex flex-col px-28 py-6 overflow-hidden">
            <ProgressHeader
              currentStep={4}
              totalSteps={4}
              title="All Recommended Facilities"
              subtitle="Full list based on your analysis"
              accentColor="#00c2cb"
            />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={() => router.push("/results")}
                className="inline-flex items-center text-base font-semibold text-teal-700 hover:text-teal-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 mr-2" /> Back to Results
              </button>
              <div className="flex flex-wrap gap-2 justify-end">
                {[
                  { key: "all", label: "All" },
                  { key: "hospital", label: "Hospitals" },
                  { key: "laboratory", label: "Laboratories" },
                  { key: "doctor", label: "Doctors" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setFilter(opt.key)}
                    className={`px-4 py-2 rounded-full border text-base font-semibold cursor-pointer transition-colors ${
                      filter === opt.key
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 bg-white rounded-lg shadow-lg border-2 border-gray-200 overflow-y-auto p-5">
              {loading ? (
                <p className="text-sm text-gray-600">Loading facilities...</p>
              ) : filteredFacilities.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No facilities available.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredFacilities.map((facility, idx) => (
                    <div
                      key={`${facility.name}-${idx}`}
                      className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <h4 className="font-semibold text-xl text-gray-900 mb-2 flex items-center gap-2">
                        <Hospital className="w-6 h-6 text-teal-600" />
                        {facility.name}
                      </h4>
                      <p className="text-base text-gray-600 mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5" />
                        {facility.address}
                      </p>

                      {/* Contact Info */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {(facility as any).type && (
                          <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                            {(facility as any).type}
                          </span>
                        )}
                        {(facility as any).phone && (
                          <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                            <Phone className="w-4 h-4 mr-1" />{" "}
                            {(facility as any).phone}
                          </span>
                        )}
                        {Array.isArray((facility as any).mobile) &&
                          (facility as any).mobile.map(
                            (m: string, i: number) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm font-medium"
                              >
                                <Phone className="w-4 h-4 mr-1" /> {m}
                              </span>
                            )
                          )}
                        {(facility as any).email && (
                          <a
                            href={`mailto:${(facility as any).email}`}
                            className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm font-medium"
                          >
                            <Mail className="w-4 h-4 mr-1" />{" "}
                            {(facility as any).email}
                          </a>
                        )}
                        {(facility as any).website && (
                          <a
                            href={(facility as any).website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm font-medium break-all"
                          >
                            <Globe className="w-4 h-4 mr-1" />{" "}
                            {(facility as any).website}
                          </a>
                        )}
                        {(facility as any).facebook && (
                          <a
                            href={(facility as any).facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm font-medium"
                          >
                            <Facebook className="w-4 h-4 mr-1" />{" "}
                            {(facility as any).facebook}
                          </a>
                        )}
                      </div>

                      <div className="mb-4 rounded-xl overflow-hidden border border-gray-300">
                        <iframe
                          src={`https://www.google.com/maps?q=${encodeURIComponent(
                            facility.google_query
                          )}&output=embed`}
                          width="100%"
                          height="200"
                          style={{ border: 0 }}
                          loading="lazy"
                          title={facility.name}
                        ></iframe>
                      </div>

                      <div className="flex gap-3">
                        {(facility as any).phone && (
                          <a
                            href={`tel:${(facility as any).phone}`}
                            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-base font-semibold text-gray-800 hover:bg-gray-50"
                          >
                            📞 {(facility as any).phone}
                          </a>
                        )}
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            facility.google_query
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-base font-semibold text-gray-800 hover:bg-gray-50"
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
