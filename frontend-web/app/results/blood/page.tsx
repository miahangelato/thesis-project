"use client";

import { useEffect, useState } from "react";
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

export default function BloodCentersPage() {
  const router = useRouter();
  const { sessionId } = useSession();
  const [loading, setLoading] = useState(true);
  const [centers, setCenters] = useState<BloodCenter[]>([]);
  const [willing, setWilling] = useState(false);
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

      const bloodCenters = Array.isArray(data.blood_centers)
        ? (data.blood_centers as BloodCenter[])
        : [];

      const willingToDonate =
        typeof data.willing_to_donate === "boolean"
          ? data.willing_to_donate
          : false;

      setCenters(bloodCenters);
      setWilling(willingToDonate || bloodCenters.length > 0);
      setLoading(false);
    };
    load();
  }, [sessionId]);

  const filteredCenters = centers.filter((c) => {
    if (cityFilter === "all") return true;
    const cityNeedle = cityFilter.toLowerCase();
    const normalizedName = (c.name || "").toLowerCase();
    const normalizedAddress = (c.address || "").toLowerCase();
    const normalizedQuery = (c.google_query || "").toLowerCase();
    return (
      normalizedAddress.includes(cityNeedle) ||
      normalizedName.includes(cityNeedle) ||
      normalizedQuery.includes(cityNeedle)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filteredCenters.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * pageSize;
  const paginatedCenters = filteredCenters.slice(
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
              title="Blood Donation Centers"
              subtitle="Full list based on your choice to donate"
              accentColor="#f43f5e"
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
                    City
                  </span>
                  <select
                    value={cityFilter}
                    onChange={(e) => {
                      setCityFilter(e.target.value);
                      setPage(1);
                    }}
                    className="h-12 rounded-xl border-2 cursor-pointer border-gray-200 bg-white px-4 text-base font-semibold text-gray-700 shadow-sm outline-none focus:border-rose-500"
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
                <p className="text-sm text-gray-600">
                  Loading blood centers...
                </p>
              ) : !willing ? (
                <p className="text-sm text-gray-600">
                  Blood donation centers are hidden because you chose not to
                  donate.
                </p>
              ) : filteredCenters.length === 0 ? (
                <p className="text-sm text-gray-600">
                  No blood donation centers available.
                </p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {paginatedCenters.map((center, idx) => (
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

                        {center.website && (
                          <div className="mb-2">
                            <a
                              href={center.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-blue-700 underline break-all"
                            >
                              {center.website}
                            </a>
                          </div>
                        )}

                        {/* Contact Info */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {center.type && (
                            <span className="inline-flex items-center px-2 py-1 bg-gray-200 text-gray-800 rounded-md text-xs font-medium">
                              {center.type}
                            </span>
                          )}
                          {center.phone && (
                            <span className="inline-flex items-center px-2 py-1 bg-green-600 text-white rounded-md text-xs font-medium">
                              <Phone className="w-3 h-3 mr-1" /> {center.phone}
                            </span>
                          )}
                          {Array.isArray(center.mobile) &&
                            center.mobile.map((m: string, i: number) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-2 py-1 bg-emerald-600 text-white rounded-md text-xs font-medium"
                              >
                                <Phone className="w-3 h-3 mr-1" /> {m}
                              </span>
                            ))}
                          {center.email && (
                            <a
                              href={`mailto:${center.email}`}
                              className="inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded-md text-xs font-medium"
                            >
                              <Mail className="w-3 h-3 mr-1" /> {center.email}
                            </a>
                          )}
                          {center.website && (
                            <a
                              href={center.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-1 bg-cyan-600 text-white rounded-md text-xs font-medium break-all"
                            >
                              <Globe className="w-3 h-3 mr-1" />{" "}
                              {center.website}
                            </a>
                          )}
                          {center.facebook && (
                            <a
                              href={center.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center px-2 py-1 bg-indigo-600 text-white rounded-md text-xs font-medium"
                            >
                              <Facebook className="w-3 h-3 mr-1" />{" "}
                              {center.facebook}
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
                          {center.phone && (
                            <a
                              href={`tel:${center.phone}`}
                              className="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium"
                            >
                              📞 {center.phone}
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
