"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useSession } from "@/contexts/session-context";
import { useBackNavigation } from "@/hooks/use-back-navigation";

import { STEPS } from "@/lib/constants";
import { API_CONFIG } from "@/lib/constants";
import { HOSPITALS_DB } from "@/data/facilities";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { ProgressHeader } from "@/components/layout/progress-header";
import { Footer } from "@/components/layout/footer";

import { FacilityQRModal } from "@/components/modals/facility-qr-modal";
import { SessionEndModal } from "@/components/modals/session-end-modal";

import { FullScreenLoader } from "@/components/ui/full-screen-loader";
import { Hospital, MapPin, ArrowLeft, Phone, Mail, Smartphone } from "lucide-react";

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
  city?: string;
}

const decodeBase64Json = (encoded: string) => {
  try {
    const binary = atob(encoded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    return JSON.parse(decoded);
  } catch (err) {
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  const { showModal, handleConfirm, handleCancel, promptBackNavigation } =
    useBackNavigation(false);

  const pageSize = 3;

  useEffect(() => {
    const load = () => {
      const activeSessionId = sessionId || sessionStorage.getItem("current_session_id");
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

      const mergedWithFallback = [
        ...merged,
        ...HOSPITALS_DB.filter((h) => !merged.some((m) => (m.name || "") === h.name)),
      ];

      setFacilities(mergedWithFallback);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      void (async () => {
        try {
          const base = API_CONFIG.BASE_URL.replace(/\/+$/, "");
          const resp = await fetch(`${base}/facilities/hospitals`, {
            signal: controller.signal,
          });
          if (resp.ok) {
            const payload = await resp.json();
            const serverHospitals = Array.isArray(payload.hospitals)
              ? payload.hospitals
              : [];
            if (serverHospitals.length > 0) {
              const mergedServer = [
                ...mergedWithFallback,
                ...serverHospitals.filter(
                  (s: Facility) =>
                    !mergedWithFallback.some((m) => (m.name || "") === s.name)
                ),
              ];
              setFacilities(mergedServer);
            }
          }
        } catch (e) {
          if (process.env.NODE_ENV !== "production")
            console.warn("Failed to fetch hospitals:", e);
        } finally {
          clearTimeout(timeout);
        }
      })();
      setLoading(false);
    };
    load();
  }, [sessionId]);

  const filteredFacilities = facilities.filter((f) => {
    const normalizedName = (f.name || "").toLowerCase();
    const normalizedAddress = (f.address || "").toLowerCase();
    const normalizedQuery = (f.google_query || "").toLowerCase();
    const normalizedCity = (f.city || "").toLowerCase();

    if (cityFilter !== "all") {
      const cityNeedle = cityFilter.toLowerCase();
      const matchesCity =
        normalizedCity.includes(cityNeedle) ||
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

  const totalPages = Math.max(1, Math.ceil(filteredFacilities.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const paginatedFacilities = filteredFacilities.slice(pageStart, pageStart + pageSize);

  const getPageNumbers = (current: number, total: number): (number | string)[] => {
    const maxVisible = 5;
    if (total <= maxVisible) return Array.from({ length: total }, (_, i) => i + 1);

    const result: (number | string)[] = [];

    if (current <= 3) {
      for (let i = 1; i <= 4; i++) result.push(i);
      result.push("...");
      result.push(total);
    } else if (current >= total - 2) {
      result.push(1);
      result.push("...");
      for (let i = total - 3; i <= total; i++) result.push(i);
    } else {
      result.push(1);
      result.push("...");
      result.push(current - 1);
      result.push(current);
      result.push(current + 1);
      result.push("...");
      result.push(total);
    }

    return result;
  };

  const handleOpenModal = (facility: Facility) => {
    setSelectedFacility(facility);
    setIsModalOpen(true);
  };

  return (
    <ProtectedRoute requireSession={true} requiredStep={STEPS.SCAN}>
      <div className="h-screen bg-white flex flex-col overflow-hidden">
        <FullScreenLoader
          isOpen={loading}
          title="Loading Facilities"
          subtitle="Please wait a moment…"
        />

        <SessionEndModal
          isOpen={showModal}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />

        <FacilityQRModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          facility={selectedFacility}
        />

        <main className="flex-1 flex flex-col overflow-hidden select-none">
          <div className="flex flex-col px-28 py-6 overflow-hidden">
            <ProgressHeader
              currentStep={4}
              totalSteps={4}
              title="All Recommended Facilities"
              subtitle="Full list based on your analysis"
              accentColor="#00c2cb"
              onEndSession={promptBackNavigation}
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
                  <span className="text-base font-semibold text-gray-700">Type:</span>
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
                  <span className="text-base font-semibold text-gray-700">City</span>
                  <select
                    value={cityFilter}
                    onChange={(e) => {
                      setCityFilter(e.target.value);
                      setPage(1);
                    }}
                    className="h-12 rounded-xl border-2 cursor-pointer border-gray-200 bg-white px-4 text-base font-semibold text-gray-700 shadow-sm outline-none focus:border-teal-500"
                  >
                    <option value="all">All Cities</option>
                    <option value="angeles">Angeles</option>
                    <option value="san fernando">San Fernando</option>
                    <option value="mabalacat">Mabalacat</option>
                    <option value="guagua">Guagua</option>
                    <option value="apalit">Apalit</option>
                    <option value="lubao">Lubao</option>
                    <option value="arayat">Arayat</option>
                    <option value="porac">Porac</option>
                    <option value="magalang">Magalang</option>
                    <option value="floridablanca">Floridablanca</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex-1">
              {filteredFacilities.length === 0 ? (
                <p className="text-sm text-gray-600">No facilities available.</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {paginatedFacilities.map((facility, idx) => (
                      <div
                        key={`${facility.name}-${idx}`}
                        className="bg-white border-2 border-gray-100 rounded-4xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col h-full min-h-[520px]"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center shrink-0 border border-teal-100">
                              <Hospital className="w-6 h-6 text-teal-600" />
                            </div>
                            <h4 className="font-bold text-2xl text-gray-900 leading-tight">
                              {facility.name}
                            </h4>
                          </div>

                          <div className="flex items-start gap-3 mb-6">
                            <MapPin className="w-5 h-5 text-gray-400 mt-1 shrink-0" />
                            <p className="text-lg text-gray-500 font-medium leading-relaxed">
                              {facility.address}
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-2 mb-8">
                            {facility.type && (
                              <span className="inline-flex items-center px-4 py-2 bg-teal-50 text-teal-700 rounded-xl text-sm font-bold border border-teal-100">
                                {facility.type}
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-2 mb-3">
                            {facility.phone && (
                              <div className="flex items-center gap-3 text-gray-600 font-bold text-lg">
                                <Phone className="w-5 h-5 text-teal-500" />{" "}
                                {facility.phone}
                              </div>
                            )}
                          </div>

                          <div>
                            {facility.email && (
                              <div className="flex items-center gap-3 text-gray-500 font-medium">
                                <Mail className="w-5 h-5 text-gray-400" />{" "}
                                {facility.email}
                              </div>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenModal(facility)}
                          className="w-full group relative overflow-hidden bg-white border-2 border-teal-500 hover:bg-teal-50 p-6 rounded-2xl transition-all active:scale-[0.98]"
                        >
                          <div className="flex items-center justify-center gap-4">
                            <Smartphone className="w-8 h-8 text-teal-600" />
                            <div className="text-left">
                              <p className="text-xl font-bold text-teal-900">
                                Get Info on Mobile
                              </p>
                              <p className="text-sm font-bold text-teal-600/70 uppercase tracking-wider">
                                Scan QR Code
                              </p>
                            </div>
                          </div>
                        </button>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <nav
                      aria-label="Pagination"
                      className="mt-8 flex items-center justify-center gap-2 flex-wrap"
                    >
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                        className={`h-12 w-20 rounded-2xl border-2 text-lg font-bold transition-all ${
                          currentPage <= 1
                            ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                            : "bg-white text-gray-700 border-gray-200 hover:border-[#00c2cb] hover:text-[#00c2cb] cursor-pointer shadow-sm"
                        }`}
                      >
                        Prev
                      </button>

                      {getPageNumbers(currentPage, totalPages).map((p, idx) =>
                        typeof p === "string" ? (
                          <span
                            key={`sep-${idx}`}
                            className="px-3 text-gray-500 select-none"
                          >
                            {p}
                          </span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setPage(p as number)}
                            aria-current={p === currentPage ? "page" : undefined}
                            className={`h-12 w-12 rounded-2xl border-2 text-lg font-bold transition-all ${
                              p === currentPage
                                ? "bg-[#00c2cb] text-white border-[#00adb5]"
                                : "bg-white text-gray-700 border-gray-200 hover:border-[#00c2cb] hover:text-[#00c2cb] cursor-pointer shadow-sm"
                            }`}
                          >
                            {p}
                          </button>
                        )
                      )}

                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                        className={`h-12 w-20 rounded-2xl border-2 text-lg font-bold transition-all ${
                          currentPage >= totalPages
                            ? "bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed"
                            : "bg-white text-gray-700 border-gray-200 hover:border-[#00c2cb] hover:text-[#00c2cb] cursor-pointer shadow-sm"
                        }`}
                      >
                        Next
                      </button>
                    </nav>
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
