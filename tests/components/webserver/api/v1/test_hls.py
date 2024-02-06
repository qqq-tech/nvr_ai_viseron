"""Test the HLS API handler."""

import datetime
import json
from unittest.mock import patch

from sqlalchemy import insert, update

from viseron.components.storage.models import Files, FilesMeta, Recordings
from viseron.domains.camera.const import CONFIG_LOOKBACK, CONFIG_RECORDER

from tests.common import BaseTestWithRecordings, MockCamera
from tests.components.webserver.common import TestAppBaseNoAuth


class TestHlsApiHandler(TestAppBaseNoAuth, BaseTestWithRecordings):
    """Test the HLS API handler."""

    def test_get_recording_hls_playlist(self):
        """Test getting a recording HLS playlist."""
        mocked_camera = MockCamera(
            identifier="test", config={CONFIG_RECORDER: {CONFIG_LOOKBACK: 5}}
        )
        with patch(
            (
                "viseron.components.webserver.request_handler.ViseronRequestHandler."
                "_get_camera"
            ),
            return_value=mocked_camera,
        ), patch(
            (
                "viseron.components.webserver.request_handler.ViseronRequestHandler"
                "._get_session"
            ),
            return_value=self._get_db_session(),
        ):
            response = self.fetch("/api/v1/hls/test/1/index.m3u8")
        assert response.code == 200
        response_string = response.body.decode()
        assert response_string.count("#EXTINF") == 3
        assert response_string.count("#EXT-X-DISCONTINUITY") == 3
        assert response_string.count("#EXT-X-ENDLIST") == 1

    def test_get_recording_hls_ongoing(self):
        """Test getting a recording HLS playlist for a recording that has not ended."""
        recording_id = 3
        with self._get_db_session() as session:
            session.execute(
                update(Recordings)
                .values(end_time=None)
                .where(Recordings.id == recording_id)
            )
            session.commit()

        mocked_camera = MockCamera(
            identifier="test", config={CONFIG_RECORDER: {CONFIG_LOOKBACK: 5}}
        )
        with patch(
            (
                "viseron.components.webserver.request_handler.ViseronRequestHandler."
                "_get_camera"
            ),
            return_value=mocked_camera,
        ), patch(
            (
                "viseron.components.webserver.request_handler.ViseronRequestHandler"
                "._get_session"
            ),
            return_value=self._get_db_session(),
        ), patch(
            "viseron.components.webserver.api.v1.hls.utcnow",
            return_value=self._now + datetime.timedelta(seconds=36),
        ):
            response = self.fetch(f"/api/v1/hls/test/{recording_id}/index.m3u8")

        assert response.code == 200
        response_string = response.body.decode()
        assert response_string.count("#EXTINF") == 4
        assert response_string.count("#EXT-X-DISCONTINUITY") == 4
        assert response_string.count("#EXT-X-ENDLIST") == 0

    def test_get_available_timespans(self):
        """Test getting available HLS timespans."""
        mocked_camera = MockCamera(
            identifier="test", config={CONFIG_RECORDER: {CONFIG_LOOKBACK: 5}}
        )

        # Insert some files in the future to mimick a gap in the timespans
        with self._get_db_session() as session:
            for i in range(5):
                timestamp = (
                    self._now
                    + datetime.timedelta(seconds=5 * i)
                    + datetime.timedelta(hours=5)
                )
                filename = f"{int(timestamp.timestamp())}.m4s"
                session.execute(
                    insert(Files).values(
                        tier_id=0,
                        camera_identifier="test",
                        category="recorder",
                        path=f"/test/{filename}",
                        directory="test",
                        filename=filename,
                        size=10,
                        created_at=timestamp,
                    )
                )
                session.execute(
                    insert(FilesMeta).values(
                        path=f"/test/{filename}",
                        orig_ctime=timestamp,
                        meta={"m3u8": {"EXTINF": 5}},
                        created_at=timestamp,
                    )
                )
            session.commit()

        with patch(
            (
                "viseron.components.webserver.request_handler.ViseronRequestHandler."
                "_get_camera"
            ),
            return_value=mocked_camera,
        ), patch(
            (
                "viseron.components.webserver.request_handler.ViseronRequestHandler"
                "._get_session"
            ),
            return_value=self._get_db_session(),
        ):
            time_from = 0
            time_to = int((self._now + datetime.timedelta(days=365)).timestamp())
            response = self.fetch(
                f"/api/v1/hls/test/available_timespans"
                f"?time_from={time_from}&time_to={time_to}"
            )
        assert response.code == 200
        assert len(json.loads(response.body)["timespans"]) == 2
