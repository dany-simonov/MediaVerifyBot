"""Unit tests for media router — type detection and routing."""

import pytest

from core.enums import MediaType
from core.exceptions import UnsupportedMediaType
from router.media_router import MediaRouter


def test_detect_image_by_mime():
    mr = MediaRouter()
    assert mr.detect_type("image/jpeg", "photo.jpg") == MediaType.IMAGE


def test_detect_audio_by_mime():
    mr = MediaRouter()
    assert mr.detect_type("audio/ogg", "voice.ogg") == MediaType.AUDIO


def test_detect_video_by_extension():
    mr = MediaRouter()
    assert mr.detect_type(None, "clip.mp4") == MediaType.VIDEO


def test_detect_text_by_content():
    mr = MediaRouter()
    assert mr.detect_type(None, None, text_content="some text here") == MediaType.TEXT


def test_unsupported_type_raises():
    mr = MediaRouter()
    with pytest.raises(UnsupportedMediaType):
        mr.detect_type("application/zip", "archive.zip")
