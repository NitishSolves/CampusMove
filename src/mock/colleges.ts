import { College } from '../types';

export const mockColleges: College[] = [
  {
    id: 'college_apex',
    name: 'Apex State University',
    shortCode: 'ASU',
    campusName: 'Main Campus & Health Sciences District',
    centerLocation: {
      lat: 34.0537,
      lng: -118.2570,
    },
    defaultZoom: 15,
    timezone: 'America/Los_Angeles',
  },
  {
    id: 'college_oakridge',
    name: 'Oakridge Institute of Technology',
    shortCode: 'OIT',
    campusName: 'Innovation Tech Valley Campus',
    centerLocation: {
      lat: 37.7749,
      lng: -122.4194,
    },
    defaultZoom: 15,
    timezone: 'America/Los_Angeles',
  },
];

export const defaultCollege = mockColleges[0];
