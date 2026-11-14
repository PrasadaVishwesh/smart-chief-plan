import type { RecipeImageCredit as RecipeImageCreditData } from "@/types/recipe";

interface RecipeImageCreditProps {
  credit?: RecipeImageCreditData;
  className?: string;
}

const RecipeImageCredit = ({ credit, className = "" }: RecipeImageCreditProps) => {
  if (!credit) return null;

  return (
    <p className={`text-xs text-muted-foreground ${className}`} onClick={(event) => event.stopPropagation()}>
      Image: <a href={credit.sourceUrl} target="_blank" rel="noreferrer">{credit.title}</a>
      {" "}by {credit.artist} via Wikimedia Commons, licensed{" "}
      <a href={credit.licenseUrl} target="_blank" rel="noreferrer">{credit.license}</a>.
    </p>
  );
};

export default RecipeImageCredit;
