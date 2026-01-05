import React from "react";
import Link from "next/link";
import { Hospital, MapPin } from "lucide-react";
import type { MapPlace, ResultsParticipantData } from "@/types/results";

export function ResultsFacilitiesTab({
  participantData,
}: {
  participantData: ResultsParticipantData;
}) {
  return (
    <div className="space-y-4">
      {/* Health Facilities */}
      {participantData?.nearby_facilities &&
        participantData.nearby_facilities.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
              <Hospital className="w-6 h-6 mr-2 text-teal-600" />
              Health Facilities Near You
            </h2>
            <div className="space-y-3">
              {participantData.nearby_facilities
                .slice(0, 1)
                .map((facility: MapPlace, idx: number) => (
                  <div
                    key={idx}
                    className="bg-linear-to-br from-gray-50 to-white border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow"
                  >
                    <h4 className="font-bold text-lg text-gray-900 mb-2">
                      {facility.name}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3 flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {facility.address}
                    </p>

                    {/* Map Embed */}
                    <div className="mb-3 rounded-lg overflow-hidden border-2 border-gray-300">
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
                          className="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium"
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
                        className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        View on Map
                      </a>
                    </div>
                  </div>
                ))}
            </div>
            {participantData.nearby_facilities.length > 1 && (
              <div className="pt-4 text-center">
                <Link
                  href="/results/hospitals"
                  className="inline-flex items-center justify-center rounded-xl bg-linear-to-r from-teal-500 to-cyan-500 px-8 py-3 text-base font-bold text-white shadow-lg transition-colors hover:from-teal-600 hover:to-cyan-600"
                >
                  View more facilities →
                </Link>
              </div>
            )}
          </div>
        )}
    </div>
  );
}
