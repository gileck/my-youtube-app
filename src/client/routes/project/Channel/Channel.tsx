import { useState } from 'react';
import { useRouter } from '@/client/features';
import { Button } from '@/client/components/template/ui/button';
import { LinearProgress } from '@/client/components/template/ui/linear-progress';
import { ErrorDisplay } from '@/client/features/template/error-tracking';
import { ArrowLeft } from 'lucide-react';
import { VideoCard } from '@/client/features/project/video-card';
import { useChannelVideos } from './hooks';
import { ChannelHeader } from './components';

export const Channel = () => {
    const { routeParams, navigate } = useRouter();
    const channelId = routeParams.channelId ?? '';

    // eslint-disable-next-line state-management/prefer-state-architecture -- ephemeral pagination state tied to channel view
    const [pageNumber, setPageNumber] = useState(1);

    const { data, isLoading, error } = useChannelVideos({ channelId, pageNumber });

    const videos = data?.data?.videos;
    const channelInfo = data?.data?.channelInfo;

    return (
        <div className="mx-auto max-w-3xl px-4 py-4">
            <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="gap-1.5 mb-3 -ml-2"
            >
                <ArrowLeft size={16} />
                Back
            </Button>

            {isLoading && !data && <LinearProgress />}

            {error && (
                <div className="mt-6">
                    <ErrorDisplay error={error} title="Failed to load channel" variant="inline" />
                </div>
            )}

            {channelInfo && <ChannelHeader channel={channelInfo} />}

            {!isLoading && !error && videos !== undefined && videos.length === 0 && (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                    No videos found for this channel
                </p>
            )}

            {videos && videos.length > 0 && (
                <>
                    <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {videos.map((video) => (
                            <VideoCard key={video.id} video={video} />
                        ))}
                    </div>

                    {data?.data?.continuation && (
                        <div className="mt-6 flex justify-center">
                            <Button
                                variant="outline"
                                onClick={() => setPageNumber((p) => p + 1)}
                                disabled={isLoading}
                            >
                                Load more
                            </Button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
