import {z} from "zod"
import {Faction} from "./primitives"

export default z.object({
	faction: Faction,
	name: z.string(),
})
