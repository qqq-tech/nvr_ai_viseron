import { AxiosError } from "axios";
import { Dayjs } from "dayjs";

type WebSocketPongResponse = {
  command_id: number;
  type: "pong";
};

export type WebSocketEventResponse = {
  command_id: number;
  type: "event";
  event: Event;
};

export type WebSocketResultResponse = {
  command_id: number;
  type: "result";
  success: true;
  result: any;
};

export type WebSocketResultErrorResponse = {
  command_id: number;
  type: "result";
  success: false;
  error: {
    code: string;
    message: string;
  };
};

export type WebSocketResponse =
  | WebSocketPongResponse
  | WebSocketEventResponse
  | WebSocketResultResponse
  | WebSocketResultErrorResponse;

export type APISuccessResponse = {
  success: true;
};

export type APIErrorResponse = AxiosError<{
  status: number;
  error: string;
}>;

export type AuthEnabledResponse = {
  enabled: boolean;
  onboarding_complete: boolean;
};

export type AuthTokenResponse = {
  header: string;
  payload: string;
  expiration: number;
  expires_at: string;
  expires_at_timestamp: number;
  session_expires_at: string;
  session_expires_at_timestamp: number;
};

export type StoredTokens = {
  header: string;
  payload: string;
  expiration: number;
  expires_at: Dayjs;
  expires_at_timestamp: number;
  session_expires_at: Dayjs;
  session_expires_at_timestamp: number;
};

export type AuthUserResponse = {
  name: string;
  username: string;
  group: string;
};

export type AuthLoginResponse = AuthTokenResponse;
export type OnboardingResponse = AuthTokenResponse;

export interface Recording {
  id: number;
  camera_identifier: string;
  start_time: string;
  start_timestamp: number;
  end_time: string;
  end_timestamp: number;
  date: string;
  trigger_type: string;
  trigger_id: number;
  thumbnail_path: string;
  hls_url: string;
}

export interface RecordingsAll {
  [identifier: string]: {
    [date: string]: {
      [id: string]: Recording;
    };
  };
}

export interface RecordingsCamera {
  [date: string]: {
    [id: string]: Recording;
  };
}

export interface Camera {
  identifier: string;
  name: string;
  width: number;
  height: number;
  access_token: string;
  still_image_refresh_interval: number;
  failed: false;
}

export interface Cameras {
  [identifier: string]: Camera;
}

export interface FailedCamera {
  identifier: string;
  name: string;
  width: number;
  height: number;
  error: string;
  retrying: boolean;
  failed: true;
}

export interface FailedCameras {
  [identifier: string]: FailedCamera;
}

export interface DetectedObject {
  label: string;
  confidence: number;
  rel_width: number;
  rel_height: number;
  rel_x1: number;
  rel_y1: number;
  rel_x2: number;
  rel_y2: number;
}

export type EventBase = {
  timestamp: number;
};

export type Event = EventBase & {
  name: string;
  data: { [key: string]: any };
};

export type EventCameraRegistered = Event & {
  name: "camera_registered";
  data: Camera;
};

export type EventRecorder = Event & {
  data: {
    camera: Camera;
    recording: Recording & {
      start_time: string;
      start_timestamp: number;
      end_time: string;
      end_timestamp: number;
      objects: [DetectedObject];
    };
  };
};

export type EventRecorderStart = EventRecorder & {
  name: "recorder_start";
};
export type EventRecorderStop = EventRecorder & {
  name: "recorder_stop";
};
export interface EntityAttributes {
  name: string;
  domain: string;
  [key: string]: any;
}

type CameraBaseEvent = {
  created_at: string;
};
type CameraTimedEvent = CameraBaseEvent & {
  start_time: string;
  start_timestamp: number;
  end_time: string | null;
  end_timestamp: number | null;
};
export type CameraMotionEvent = CameraTimedEvent & {
  type: "motion";
};
export type CameraRecordingEvent = CameraTimedEvent & {
  type: "recording";
};
export type CameraTimedEvents = CameraMotionEvent | CameraRecordingEvent;
type CameraSnapshotEvent = CameraBaseEvent & {
  time: string;
  timestamp: number;
  snapshot_path: string;
};
export type CameraObjectEvent = CameraSnapshotEvent & {
  type: "object";
  time: string;
  timestamp: number;
  label: string;
  confidence: number;
};

export type CameraEvent =
  | CameraMotionEvent
  | CameraObjectEvent
  | CameraRecordingEvent;

export type CameraEvents = {
  events: [CameraEvent];
};

export interface Entity {
  entity_id: string;
  state: string;
  attributes: EntityAttributes;
}

export interface Entities {
  [index: string]: Entity;
}

export interface State {
  entity_id: string;
  state: string;
  attributes: EntityAttributes;
  timestamp: number;
}

export type StateChangedEvent = EventBase & {
  name: "state_changed";
  data: {
    entity_id: string;
    current_state: State;
    previous_state: State;
  };
};

export type HlsAvailableTimespan = {
  start: number;
  end: number;
  duration: number;
};

export type HlsAvailableTimespans = {
  timespans: [HlsAvailableTimespan];
};
