interface VideoPlayerProps {
    videoId: string;
}

export const VideoPlayer = ({ videoId }: VideoPlayerProps) => {
    return (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-foreground">
            <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
            />
        </div>
    );
};
