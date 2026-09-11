extends Node2D
class_name SliceFeedbackBurst

var tint := Color.WHITE
var ttl := 0.28
var lifetime := 0.28
var points: Array[Vector2] = []
var velocities: Array[Vector2] = []

func setup(color: Color, count: int, speed: float) -> void:
	tint = color
	points.clear()
	velocities.clear()
	for i in range(maxi(1, count)):
		var angle := TAU * float(i) / float(maxi(1, count)) + randf_range(-0.28, 0.28)
		var magnitude := speed * randf_range(0.48, 1.0)
		points.append(Vector2.ZERO)
		velocities.append(Vector2.from_angle(angle) * magnitude + Vector2.UP * speed * 0.18)
	queue_redraw()

func _process(delta: float) -> void:
	ttl -= delta
	for i in range(points.size()):
		points[i] += velocities[i] * delta
		velocities[i] = velocities[i] * maxf(0.0, 1.0 - delta * 5.0) + Vector2.DOWN * 180.0 * delta
	if ttl <= 0.0:
		queue_free()
	else:
		queue_redraw()

func _draw() -> void:
	var alpha := clampf(ttl / lifetime, 0.0, 1.0)
	for p in points:
		draw_circle(p, 1.5 + alpha * 2.0, Color(tint.r, tint.g, tint.b, alpha * 0.92))
