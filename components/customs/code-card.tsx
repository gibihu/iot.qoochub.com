export function CodeCard({children}:{children: React.ReactNode}){
    return(
        <div className="w-full p-2  rounded-md  bg-accent">
            {children}
        </div>
    );
}