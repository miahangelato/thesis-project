"use client";

import { useEffect, useState } from "react";
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
  mobile?: string[];
  email?: string;
  website?: string;
  facebook?: string;
  type?: string;
  google_query: string;
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
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [page, setPage] = useState(1);

  const pageSize = 3;

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
        data?: unknown;
      } | null;
      if (!dataWithExpiry) {
        setLoading(false);
        return;
      }

      const data =
        dataWithExpiry.data && typeof dataWithExpiry.data === "object"
          ? (dataWithExpiry.data as Record<string, unknown>)
          : {};

      const readFacilityArray = (value: unknown): Facility[] =>
        Array.isArray(value) ? (value as Facility[]) : [];

      const hospitalsDb = readFacilityArray(data.hospitals_db);
      const laboratoriesDb = readFacilityArray(data.laboratories_db);
      const doctorsDb = readFacilityArray(data.diabetes_doctors_db);
      const nearby = readFacilityArray(data.nearby_facilities);

      const normalizedLaboratories = laboratoriesDb.map((lab) => ({
        ...lab,
        type: lab.type || "Laboratory",
      }));

      const normalizedDoctors = doctorsDb.map((doc) => ({
        ...doc,
        type: doc.type || "Doctor",
        address: doc.address || "Clinic details provided upon contact",
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
    const normalizedQuery = (f.google_query || "").toLowerCase();

    if (cityFilter !== "all") {
      const cityNeedle = cityFilter.toLowerCase();
      const matchesCity =
        normalizedAddress.includes(cityNeedle) ||
        normalizedName.includes(cityNeedle) ||
        normalizedQuery.includes(cityNeedle);
      if (!matchesCity) return false;
    }

    if (filter === "all") return true;
    const type = f.type?.toLowerCase() || "";
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

  const totalPages = Math.max(
    1,
    Math.ceil(filteredFacilities.length / pageSize)
  );
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const paginatedFacilities = filteredFacilities.slice(
    pageStart,
    pageStart + pageSize
  );

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
                className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-5 py-3 text-base font-bold text-gray-800 shadow-sm transition-colors hover:bg-gray-50 cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5" /> Back to Results
              </button>
              <div className="flex flex-wrap items-center justify-end gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-gray-700">
                    Type:
                  </span>
                  <select
                    value={filter}
                    onChange={(e) => {
                      setFilter(e.target.value);
                      setPage(1);
                    }}
                    className="h-12 rounded-xl border-2 cursor-pointer border-gray-200 bg-white px-4 text-base font-semibold text-gray-700 shadow-sm outline-none focus:border-teal-500"
                  >
                    <option value="all">All</option>
                    <option value="hospital">Hospitals</option>
                    <option value="laboratory">Laboratories</option>
                    <option value="doctor">Doctors</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-base font-semibold text-gray-700">
                    City
                  </span>
                  <select
                    value={cityFilter}
                    onChange={(e) => {
                      setCityFilter(e.target.value);
                      setPage(1);
                    }}
                    className="h-12 rounded-xl border-2 cursor-pointer border-gray-200 bg-white px-4 text-base font-semibold text-gray-700 shadow-sm outline-none focus:border-cyan-500"
                  >
                    <option value="all">All Cities</option>
                    <option value="angeles">Angeles</option>
                    <option value="san fernando">San Fernando</option>
                    <option value="mabalacat">Mabalacat</option>
                  </select>
                </div>
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
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {paginatedFacilities.map((facility, idx) => (
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
                          {facility.type && (
                            <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                              {facility.type}
                            </span>
                          )}
                          {facility.phone && (
                            <span className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                              <Phone className="w-4 h-4 mr-1" />{" "}
                              {facility.phone}
                            </span>
                          )}
                          {Array.isArray(facility.mobile) &&
                            facility.mobile.map((m: string, i: number) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm font-medium"
                              >
                                <Phone className="w-4 h-4 mr-1" /> {m}
                              </span>
                            ))}
                          {facility.email && (
                            <a
                              href={`mailto:${facility.email}`}
                              className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm font-medium"
                            >
                              <Mail className="w-4 h-4 mr-1" /> {facility.email}
                            </a>
                          )}
                          {facility.website && (
                            <a
                              href={facility.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm font-medium break-all"
                            >
                              <Globe className="w-4 h-4 mr-1" />{" "}
                              {facility.website}
                            </a>
                          )}
                          {facility.facebook && (
                            <a
                              href={facility.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-800 rounded-full text-sm font-medium"
                            >
                              <Facebook className="w-4 h-4 mr-1" />{" "}
                              {facility.facebook}
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
                          {facility.phone && (
                            <a
                              href={`tel:${facility.phone}`}
                              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-base font-semibold text-gray-800 hover:bg-gray-50"
                            >
                              📞 {facility.phone}
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

                  {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-3">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        className={`px-4 py-2 rounded-lg border text-base font-semibold transition-colors ${
                          currentPage <= 1
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 cursor-pointer"
                        }`}
                      >
                        Previous
                      </button>

                      <div className="text-base font-semibold text-gray-700">
                        Page {currentPage} of {totalPages}
                      </div>

                      <button
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={currentPage >= totalPages}
                        className={`px-4 py-2 rounded-lg border text-base font-semibold transition-colors ${
                          currentPage >= totalPages
                            ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed"
                            : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 cursor-pointer"
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          <Footer fixed={true} />
        </main>
      </div>
    </ProtectedRoute>
  );
}
