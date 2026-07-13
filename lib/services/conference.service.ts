import {
  AGENDA,
  COMMITTEE,
  HOME_FEATURES,
  SPEAKERS,
  SPONSORS,
  STATISTICS,
  VENUE_HIGHLIGHTS
} from "@/constants/conference";

export function getConferenceOverview() {
  return {
    statistics: STATISTICS,
    features: HOME_FEATURES,
    speakers: SPEAKERS,
    agenda: AGENDA,
    committee: COMMITTEE,
    sponsors: SPONSORS,
    venueHighlights: VENUE_HIGHLIGHTS
  };
}
