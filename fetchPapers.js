import axios from "axios";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
dotenv.config();

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Scopus author ID
const SCOPUS_AUTHOR_ID = "59361198200";

// Fetch and sync Scopus papers with Supabase
const fetchScopusPapers = async () => {
  try {
    const response = await axios.get(
      `https://api.elsevier.com/content/search/scopus?query=AU-ID(${SCOPUS_AUTHOR_ID})`,
      {
        headers: {
          "X-ELS-APIKey": process.env.ELSEVIER_API_KEY,
          Accept: "application/json",
        },
      }
    );

    const results = response.data["search-results"]?.entry || [];

    if (!results.length) {
      console.log("⚠️ No papers found for this author ID.");
      return;
    }

    for (const paper of results) {
      const title = paper["dc:title"];
      const citationCount = parseInt(paper["citedby-count"], 10);
      const year = paper["prism:coverDate"]?.slice(0, 4);

      // 1️⃣ Check if paper already exists by title
      const { data: existing, error: fetchError } = await supabase
        .from("papers")
        .select("id, citation_count")
        .eq("title", title)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        // PGRST116 = no rows found (normal case for insert)
        console.error("Error checking existing paper:", fetchError.message);
        continue;
      }

      if (existing) {
        // 2️⃣ Paper exists — update if citation count has changed
        if (existing.citation_count !== citationCount) {
          const { error: updateError } = await supabase
            .from("papers")
            .update({ citation_count: citationCount })
            .eq("id", existing.id);

          if (updateError) {
            console.error("Error updating citation count:", updateError.message);
          } else {
            console.log(`✅ Updated citation count for: ${title}`);
          }
        } else {
          console.log(`ℹ️ No change in citation count: ${title}`);
        }
      } else {
        // 3️⃣ Paper doesn't exist — insert it
        const { error: insertError } = await supabase
          .from("papers")
          .insert([{ title, citation_count: citationCount, year }]);

        if (insertError) {
          console.error("Error inserting paper:", insertError.message);
        } else {
          console.log(`✅ New paper added: ${title}`);
        }
      }
    }
  } catch (error) {
    console.error("❌ Error fetching Scopus papers:", error.message);
  }
};

fetchScopusPapers();
