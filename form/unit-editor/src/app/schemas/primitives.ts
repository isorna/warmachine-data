import {z} from "zod"

// This schema is used to validate the core structure of the files that contain the required schema.
export const Dataset = z.record(z.string(), z.any())

export const Abilities = z.array(z.union([z.string(), z.array(z.string())]))
export const Army = z.string()
export const ModelAdvantage = z.string()
export const Faction = z.string()

export const Feat = z.record(z.string(), z.object({
	name: z.string(),
	rules: z.string(),
}))

export const Points = z.number().positive()
export const Range = z.union([z.number().positive(), z.literal("self"), z.literal("controlRange")])
export const WeaponQuality = z.string()

export const WeaponType = z.enum([
	"melee",
	"ranged",
])

export const Weapon = z.object({
	abilities: Abilities.optional(),
	name: z.string(),
	qualities: z.array(WeaponQuality).optional(),
	quantity: z.number().positive(),
	statistics: z.object({
		range: z.union([z.number(), z.string().regex(new RegExp("^Spray [0-9]+$")), z.literal("controlRange")]),
		rateOfFire: z.union([z.number(), z.string().optional()]),
		power: z.union([z.number(), z.string().regex(new RegExp("^[0-9]+\/[0-9]+$"))]),
	}),
	type: WeaponType,
})

export const Weapons = z.record(z.string(), Weapon)

export const Statistics = z.object({
	arcana: z.number().optional(),
	arcaneAttack: z.number().optional(),
	armour: z.number(),
	controlRange: z.number().optional(),
	defense: z.number(),
	health: z.number(),
	meleeAttack: z.number().optional(),
	rangedAttack: z.number().optional(),
	speed: z.number(),
})

export const Option = z.object({
	granted: z.array(z.string()).optional(),
	name: z.string(),
	points: Points,
	weapons: z.array(Weapon).optional(),
})
