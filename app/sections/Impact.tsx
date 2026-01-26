import { GrowthChart } from '../components/charts/GrowthChart';
import { NeoCard } from '../components/ui/NeoCard';
import { Section } from '../components/ui/Section';
import stats from '../data/precomputed/impact-stats.json';

export function Impact() {
    const { roles, experience } = stats;

    // Sort experience logically if possible, otherwise it's by count
    // Custom sort order for experience
    const expOrder = ['1-3', '3-5', '5-10', '10+'];
    experience.sort((a, b) => {
        const idxA = expOrder.indexOf(a.name);
        const idxB = expOrder.indexOf(b.name);
        if (idxA === -1) return 1;
        if (idxB === -1) return -1;
        return idxA - idxB;
    });

    return (
        <Section
            title="who is building?"
            subtitle="a look at the demographics and growth of the community"
            id="impact"
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <NeoCard className="lg:col-span-2">
                    <h3 className="text-2xl font-bold mb-6 font-heading">
                        monthly attendance
                    </h3>
                    <GrowthChart />
                </NeoCard>

                <NeoCard variant="cyan">
                    <h3 className="text-2xl font-bold mb-6 font-heading">
                        builder roles
                    </h3>
                    <div className="space-y-4">
                        {roles.map(item => (
                            <div key={item.name}>
                                <div className="flex justify-between text-sm font-sans mb-1 font-bold">
                                    <span>{item.name}</span>
                                    <span>{item.value}</span>
                                </div>
                                <div className="w-full bg-zinc-900 border-2 border-border h-3">
                                    <div
                                        className="h-full bg-primary"
                                        style={{
                                            width: `${(item.value / roles[0].value) * 100}%`
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </NeoCard>

                <NeoCard variant="magenta">
                    <h3 className="text-2xl font-bold mb-6 font-heading text-white">
                        years of experience
                    </h3>
                    <div className="space-y-4">
                        {experience.map(item => (
                            <div key={item.name}>
                                <div className="flex justify-between text-sm font-sans mb-1 font-bold text-white">
                                    <span>{item.name} years</span>
                                    <span>{item.value}</span>
                                </div>
                                <div className="w-full bg-zinc-900 h-3 border-2 border-border">
                                    <div
                                        className="h-full bg-primary"
                                        style={{
                                            width: `${(item.value / Math.max(...experience.map(e => e.value))) * 100}%`
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </NeoCard>
            </div>
        </Section>
    );
}
