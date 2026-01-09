import React from "react";
import Link from "next/link";
import { Heart, MapPin } from "lucide-react";
import type { MapPlace, ResultsParticipantData } from "@/types/results";

export function ResultsBloodTab({
  participantData,
  canShowBloodTab,
}: {
  participantData: ResultsParticipantData;
  canShowBloodTab: boolean;
}) {
  if (!canShowBloodTab) return null;

  return (
    <div className="space-y-4">
      {participantData?.blood_centers &&
      participantData.blood_centers.length > 0 ? (
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
            <Heart className="w-6 h-6 mr-2 text-red-600" />
            Blood Donation Centers
          </h2>
          <div className="space-y-3">
            {participantData.blood_centers
              .slice(0, 1)
              .map((center: MapPlace, idx: number) => (
                <div
                  key={idx}
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

                  {/* Map Embed */}
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
          {participantData.blood_centers.length > 1 && (
            <div className="pt-4 text-center">
              <Link
                href="/results/blood"
                className="inline-flex items-center justify-center rounded-xl bg-linear-to-r from-rose-500 to-red-500 px-8 py-3 text-base font-bold text-white shadow-lg transition-colors hover:from-rose-600 hover:to-red-600"
              >
                View more blood centers →
              </Link>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          No blood donation centers available.
        </p>
      )}
    </div>
  );
}
