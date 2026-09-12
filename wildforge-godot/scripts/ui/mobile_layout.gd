class_name SliceMobileLayout
extends RefCounted

const MIN_TOUCH_TARGET := 56.0
const EDGE_PADDING := 18.0

static func safe_insets_for(viewport_size: Vector2, window_size: Vector2i, safe_area: Rect2i) -> Vector4:
	if viewport_size.x <= 0.0 or viewport_size.y <= 0.0 or window_size.x <= 0 or window_size.y <= 0:
		return Vector4.ZERO
	if safe_area.size.x <= 0 or safe_area.size.y <= 0:
		return Vector4.ZERO
	var sx := viewport_size.x / float(window_size.x)
	var sy := viewport_size.y / float(window_size.y)
	var left := maxf(0.0, float(safe_area.position.x) * sx)
	var top := maxf(0.0, float(safe_area.position.y) * sy)
	var right_px := maxf(0.0, float(window_size.x - safe_area.end.x))
	var bottom_px := maxf(0.0, float(window_size.y - safe_area.end.y))
	return Vector4(left, top, right_px * sx, bottom_px * sy)

static func current_safe_insets(viewport_size: Vector2) -> Vector4:
	var server := DisplayServer.get_name()
	if server not in ["Android", "iOS"]:
		return Vector4.ZERO
	return safe_insets_for(viewport_size, DisplayServer.window_get_size(), DisplayServer.get_display_safe_area())

static func content_rect(viewport_size: Vector2) -> Rect2:
	var insets := current_safe_insets(viewport_size)
	return Rect2(
		Vector2(insets.x + EDGE_PADDING, insets.y + EDGE_PADDING),
		Vector2(
			maxf(0.0, viewport_size.x - insets.x - insets.z - EDGE_PADDING * 2.0),
			maxf(0.0, viewport_size.y - insets.y - insets.w - EDGE_PADDING * 2.0)
		)
	)
