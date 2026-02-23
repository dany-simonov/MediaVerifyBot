"""Custom application exceptions."""


class RateLimitExceeded(Exception):
    """Raised when a user exceeds their daily/monthly check limit."""


class UnsupportedMediaType(Exception):
    """Raised when the uploaded file type is not supported."""


class ExternalAPIError(Exception):
    """Raised when an external API (SightEngine, Resemble, etc.) fails."""

    def __init__(self, service: str, detail: str) -> None:
        self.service = service
        self.detail = detail
        super().__init__(f"{service}: {detail}")


class FileTooLarge(Exception):
    """Raised when the uploaded file exceeds the size limit."""


class VideoTooLong(Exception):
    """Raised when the uploaded video exceeds the duration limit."""
