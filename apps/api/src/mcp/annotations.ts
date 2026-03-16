export const READ_ONLY_TOOL_ANNOTATIONS = {
    readOnlyHint: true,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
} as const;

export const ACTION_TOOL_ANNOTATIONS = {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: true,
} as const;
