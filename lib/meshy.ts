export type MeshyStatus = {
	ok: boolean;
	status: string;
};

export function getMeshyStatus(): MeshyStatus {
	return { ok: true, status: 'unknown' };
}

