class_name SliceWorldOwnershipAuthority
extends RefCounted

const WILDERNESS := "wilderness"

var region_claims: Array = []
var cell_claims: Dictionary = {}

func resolve(cell: Vector2i) -> Dictionary:
	if cell_claims.has(cell):
		return (cell_claims[cell] as Dictionary).duplicate(true)
	for index in range(region_claims.size() - 1, -1, -1):
		var claim: Dictionary = region_claims[index]
		var rect: Rect2i = claim.get("rect", Rect2i())
		if rect.has_point(cell):
			return _public_claim(claim)
	return _wilderness_claim()

func owner_at(cell: Vector2i) -> String:
	return String(resolve(cell).get("owner_id", WILDERNESS))

func claim_region(owner_id: String, rect: Rect2i, zone_type := "territory", structure_id := "") -> bool:
	if owner_id.is_empty() or owner_id == WILDERNESS or rect.size.x <= 0 or rect.size.y <= 0:
		return false
	region_claims.append({"owner_id": owner_id, "rect": rect, "zone_type": zone_type, "structure_id": structure_id})
	return true
func claim_cells(owner_id: String, cells: Array, zone_type := "structure", structure_id := "") -> int:
	if owner_id.is_empty() or owner_id == WILDERNESS:
		return 0
	var claimed := 0
	for raw in cells:
		if not raw is Vector2i:
			continue
		cell_claims[raw] = {"owner_id": owner_id, "zone_type": zone_type, "structure_id": structure_id}
		claimed += 1
	return claimed

func release_region(owner_id: String, rect: Rect2i) -> int:
	var removed := 0
	for index in range(region_claims.size() - 1, -1, -1):
		var claim: Dictionary = region_claims[index]
		if String(claim.get("owner_id", "")) == owner_id and (claim.get("rect") as Rect2i) == rect:
			region_claims.remove_at(index)
			removed += 1
	return removed

func transfer_owner(from_owner: String, to_owner: String) -> int:
	if to_owner.is_empty() or to_owner == WILDERNESS:
		return 0
	var changed := 0
	for claim in region_claims:
		if String((claim as Dictionary).get("owner_id", "")) == from_owner:
			(claim as Dictionary)["owner_id"] = to_owner
			changed += 1
	for raw_cell in cell_claims.keys():
		var cell_claim: Dictionary = cell_claims[raw_cell]
		if String(cell_claim.get("owner_id", "")) == from_owner:
			cell_claim["owner_id"] = to_owner
			cell_claims[raw_cell] = cell_claim
			changed += 1
	return changed

func clear() -> void:
	region_claims.clear()
	cell_claims.clear()

func export_claims() -> Dictionary:
	var regions: Array = []
	for raw in region_claims:
		var claim: Dictionary = raw
		var rect: Rect2i = claim.get("rect", Rect2i())
		regions.append([String(claim.get("owner_id", "")), rect.position.x, rect.position.y, rect.size.x, rect.size.y, String(claim.get("zone_type", "territory")), String(claim.get("structure_id", ""))])
	var cells: Array = []
	for raw_cell in cell_claims.keys():
		var cell: Vector2i = raw_cell
		var claim: Dictionary = cell_claims[cell]
		cells.append([cell.x, cell.y, String(claim.get("owner_id", "")), String(claim.get("zone_type", "structure")), String(claim.get("structure_id", ""))])
	return {"regions": regions, "cells": cells}
func restore_claims(data: Dictionary) -> bool:
	var regions = data.get("regions", [])
	var cells = data.get("cells", [])
	if not regions is Array or not cells is Array:
		return false
	clear()
	for row in regions:
		if not row is Array or row.size() < 7:
			clear()
			return false
		var owner := String(row[0])
		var rect := Rect2i(int(row[1]), int(row[2]), int(row[3]), int(row[4]))
		if not claim_region(owner, rect, String(row[5]), String(row[6])):
			clear()
			return false
	for row in cells:
		if not row is Array or row.size() < 5:
			clear()
			return false
		var owner := String(row[2])
		if claim_cells(owner, [Vector2i(int(row[0]), int(row[1]))], String(row[3]), String(row[4])) != 1:
			clear()
			return false
	return true

func _public_claim(claim: Dictionary) -> Dictionary:
	return {"owner_id": String(claim.get("owner_id", WILDERNESS)), "zone_type": String(claim.get("zone_type", "territory")), "structure_id": String(claim.get("structure_id", ""))}

func _wilderness_claim() -> Dictionary:
	return {"owner_id": WILDERNESS, "zone_type": "wilderness", "structure_id": ""}
