import { NeoCard } from '../components/ui/NeoCard';
import { Section } from '../components/ui/Section';
import stats from '../data/precomputed/interests-stats.json';

export function Interests() {
    const { interests } = stats;

    // Take top 6
    const topInterests = interests.slice(0, 6);

    return (
        <Section
            title="community interests"
            subtitle="what our builders want to see more of"
            id="interests"
        >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topInterests.map((item, idx) => (
                    <NeoCard
                        key={item.name}
                        variant={
                            idx % 3 === 0
                                ? 'cyan'
                                : idx % 3 === 1
                                  ? 'magenta'
                                  : 'yellow'
                        }
                        className="flex flex-col justify-between"
                    >
                        <div className="text-4xl font-black mb-4 font-heading text-primary">
                            #{idx + 1}
                        </div>
                        <div>
                            <h4 className="font-bold text-lg mb-2 text-white font-heading">
                                {item.name.toLowerCase()}
                            </h4>
                            <div className="w-full bg-zinc-800 h-4 border-2 border-white">
                                <div
                                    className="h-full bg-primary"
                                    style={{
                                        width: `${(item.value / interests[0].value) * 100}%`
                                    }}
                                />
                            </div>
                            <div className="text-right font-sans text-sm mt-1 text-zinc-400">
                                {item.value} votes
                            </div>
                        </div>
                    </NeoCard>
                ))}
            </div>
        </Section>
    );
}
