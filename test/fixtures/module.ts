export function pick(ready: boolean): string {
	if (ready) {
		return "yes";
	}

	return "no";
}
