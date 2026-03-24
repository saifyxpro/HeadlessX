/**
 * Headfox version constants.
 */

export const CONSTRAINTS = {
	MIN_VERSION: "beta.19",
	MAX_VERSION: "1",
	asRange(): string {
		return `>=${CONSTRAINTS.MIN_VERSION}, <${CONSTRAINTS.MAX_VERSION}`;
	},
} as const;
