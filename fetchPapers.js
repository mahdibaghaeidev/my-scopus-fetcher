import axios from "axios";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
dotenv.config();

// Supabase setup
const supabaseUrl = process.env.SUPABASE_URL; // Add your Supabase URL here
const supabaseKey = process.env.SUPABASE_API_KEY; // Add your Supabase API key here
const supabase = createClient(supabaseUrl, supabaseKey);

// Scopus author ID
const SCOPUS_AUTHOR_ID = "59361198200";

// Fetch and save Scopus papers
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

    // Iterate over the results and save the details to Supabase
    for (const paper of results) {
      const title = paper["dc:title"];
      const citationCount = paper["citedby-count"];
      const year = paper["prism:coverDate"]?.slice(0, 4); // Extract the year

      // Insert paper details into Supabase
      const { data, error } = await supabase
        .from("papers") // Replace with your table name
        .insert([
          {
            title,
            citation_count: citationCount,
            year,
          },
        ]);

      if (error) {
        console.error("Error inserting paper into Supabase:", error.message);
      } else {
        console.log(`Paper added: ${title}`);
      }
    }
  } catch (error) {
    console.error("Error fetching Scopus papers:", error.message);
  }
};

fetchScopusPapers();
