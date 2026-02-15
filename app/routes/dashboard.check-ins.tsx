import { redirect, type LoaderFunctionArgs } from 'react-router';

export async function loader({ request }: LoaderFunctionArgs) {
    const url = new URL(request.url);
    const search = url.search ? url.search : '';
    return redirect(`/dashboard#check-ins${search}`);
}

export default function DashboardCheckInsRedirect() {
    return null;
}
