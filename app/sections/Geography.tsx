import { CommunityMap } from '../components/map/CommunityMap';
import { Section } from '../components/ui/Section';

export function Geography() {
    return (
        <Section
            id="geography"
            title="community geography"
            subtitle="where are our builders coming from? based on zip codes provided during registration"
        >
            <div className="mt-8">
                <CommunityMap />
            </div>
        </Section>
    );
}
