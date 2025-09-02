// src/services/documentGeneration.ts
import axios from 'axios';
import { Product, AestheticAnalysis } from "../types";
import { apiGateway } from "./apiGateway";
import { messageQueueService } from "./messageQueue";

export class DocumentGenerationService {
  private foxitApiKey: string;
  private baseUrl: string;

  constructor() {
    this.foxitApiKey = import.meta.env.VITE_FOXIT_API_KEY;
    this.baseUrl =
      import.meta.env.VITE_FOXIT_BASE_URL || "https://api.foxit.com/v1";
  }

  async generateStyleGuide(
    aesthetic: AestheticAnalysis,
    products: Product[],
    userId?: string
  ): Promise<string> {
    try {
      // Queue the document generation task
      const taskId = await messageQueueService.addTask(
        `document-generation:${aesthetic.style}-style-guide`,
        "high"
      );

      await messageQueueService.sendNotification(
        "Creating your personalized style guide...",
        "info"
      );

      const styleGuideContent = this.createStyleGuideContent(
        aesthetic,
        products
      );

      // Try Foxit API for document generation
      let pdfUrl: string;
      
      try {
        const response = await axios.post(
          `${this.baseUrl}/documents/generate`,
          {
            template: "style-guide-template",
            content: styleGuideContent,
            format: "pdf",
            options: {
              page_size: "A4",
              orientation: "portrait",
              include_images: true,
              brand_colors: aesthetic.colors,
              style_theme: aesthetic.style.toLowerCase().replace(/\s+/g, "-"),
            },
          },
          {
            headers: {
              Authorization: `Bearer ${this.foxitApiKey}`,
              "Content-Type": "application/json",
            },
            timeout: 30000
          }
        );

        pdfUrl = response.data.document_url;
      } catch (foxitError) {
        console.warn('Foxit API unavailable, using fallback generation');
        pdfUrl = await this.simulatePdfGeneration(styleGuideContent);
      }

      // Optimize the generated PDF if possible
      const optimizedPdfUrl = await this.optimizePdf(pdfUrl);

      await messageQueueService.sendNotification(
        `Your ${aesthetic.style} style guide is ready for download!`,
        "success"
      );

      return optimizedPdfUrl;
    } catch (error) {
      console.error("Document generation error:", error);

      await messageQueueService.sendNotification(
        "Style guide generation failed, creating simplified version",
        "warning"
      );

      // Fallback to simple text generation
      const fallbackContent = this.createStyleGuideContent(aesthetic, products);
      return await this.simulatePdfGeneration(fallbackContent);
    }
  }

  async generateStyleGuideAsync(
    aesthetic: AestheticAnalysis,
    products: Product[],
    userId?: string
  ): Promise<string> {
    // Queue document generation for background processing
    const taskId = await messageQueueService.addTask(
      `async-document-generation:${aesthetic.style}`,
      "normal"
    );

    // Process document generation in background
    this.processAsyncDocumentGeneration(taskId, aesthetic, products, userId);

    return taskId;
  }

  private async processAsyncDocumentGeneration(
    taskId: string,
    aesthetic: AestheticAnalysis,
    products: Product[],
    userId?: string
  ): Promise<void> {
    try {
      await messageQueueService.sendNotification(
        "Starting style guide generation...",
        "info"
      );

      // Generate multiple document formats in parallel
      const [pdfUrl, htmlPreview] = await Promise.all([
        this.generatePdfDocument(aesthetic, products, userId),
        this.generateHtmlPreview(aesthetic, products),
      ]);

      // Optimize documents
      const optimizedPdfUrl = await this.optimizePdf(pdfUrl);

      await messageQueueService.sendNotification(
        `Your complete ${aesthetic.style} style guide package is ready!`,
        "success"
      );

      // Store results (in real app, save to database with taskId)
      console.log(`Async document generation ${taskId} completed`, {
        pdf: optimizedPdfUrl,
        html: htmlPreview,
      });
    } catch (error) {
      console.error("Async document generation error:", error);
      await messageQueueService.sendNotification(
        "Document generation encountered an issue",
        "error"
      );
    }
  }

  private async generatePdfDocument(
    aesthetic: AestheticAnalysis,
    products: Product[],
    userId?: string
  ): Promise<string> {
    const content = this.createStyleGuideContent(aesthetic, products);

    try {
      const response = await axios.post(
        `${this.baseUrl}/documents/generate`,
        {
          template: "premium-style-guide",
          content,
          format: "pdf",
          options: {
            page_size: "A4",
            orientation: "portrait",
            include_images: true,
            brand_colors: aesthetic.colors,
            style_theme: aesthetic.style.toLowerCase().replace(/\s+/g, "-"),
            user_id: userId,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.foxitApiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 30000
        }
      );

      return response.data.document_url;
    } catch (error) {
      console.error("PDF generation failed:", error);
      return await this.simulatePdfGeneration(content);
    }
  }

  private async generateHtmlPreview(
    aesthetic: AestheticAnalysis,
    products: Product[]
  ): Promise<string> {
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${aesthetic.style} Style Guide</title>
        <style>
          body { font-family: 'Georgia', serif; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
          .header { text-align: center; margin-bottom: 40px; }
          .color-palette { display: flex; gap: 10px; margin: 20px 0; }
          .color-swatch { width: 50px; height: 50px; border-radius: 50%; }
          .product-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
          .product-card { border: 1px solid #eee; padding: 15px; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${aesthetic.style} Style Guide</h1>
          <p>${aesthetic.mood} aesthetic curated just for you</p>
        </div>
        
        <div class="color-palette">
          ${aesthetic.colors
            .map(
              (color) =>
                `<div class="color-swatch" style="background-color: ${color}"></div>`
            )
            .join("")}
        </div>
        
        <div class="product-grid">
          ${products
            .map(
              (product) => `
            <div class="product-card">
              <img src="${product.image}" alt="${product.title}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 4px;">
              <h3>${product.title}</h3>
              <p>${product.price}</p>
              <p>★ ${product.rating}</p>
            </div>
          `
            )
            .join("")}
        </div>
      </body>
      </html>
    `;

    return htmlContent;
  }

  private createStyleGuideContent(
    aesthetic: AestheticAnalysis,
    products: Product[]
  ): string {
    return `
      # ${aesthetic.style} Style Guide
      *Curated by Fesoni AI*
      
      ## Your Aesthetic Profile
      **Style Identity:** ${aesthetic.style}
      **Mood & Vibe:** ${aesthetic.mood}
      **Signature Colors:** ${aesthetic.colors.join(" • ")}
      **Key Elements:** ${aesthetic.keywords.join(" • ")}
      **Confidence Score:** ${Math.round((aesthetic.confidence || 0.8) * 100)}%
      
      ## Curated Product Collection
      ${products
        .map(
          (product, index) => `
      ### ${index + 1}. ${product.title}
      **Price:** ${product.price} | **Rating:** ★${product.rating}
      
      *Why it fits your aesthetic:* This piece embodies your ${
        aesthetic.style
      } vision with its ${
            aesthetic.mood
          } energy. The design elements align perfectly with your preference for ${aesthetic.colors
            .slice(0, 2)
            .join(" and ")} tones.
      
      ---
      `
        )
        .join("\n")}
      
      ## Styling Philosophy
      Your ${aesthetic.style} aesthetic thrives on ${
      aesthetic.mood
    } elements. Focus on:
      
      **Color Harmony:** Stick to your core palette of ${aesthetic.colors.join(
        ", "
      )} for a cohesive look.
      
      **Texture Balance:** Mix ${aesthetic.keywords
        .slice(0, 3)
        .join(", ")} textures to create visual interest.
      
      **Mood Consistency:** Every piece should enhance the ${
        aesthetic.mood
      } atmosphere you're creating.
      
      ## Shopping Tips
      - Look for pieces that combine 2-3 of your key colors
      - Prioritize quality over quantity to maintain your aesthetic integrity
      - Mix vintage and modern pieces to create depth in your ${
        aesthetic.style
      } space
      
      ---
      *Generated on ${new Date().toLocaleDateString()} by Fesoni AI*
      *Your personal aesthetic assistant*
    `;
  }

  private async simulatePdfGeneration(content: string): Promise<string> {
    // Simulate API processing time with realistic delays
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Create a more realistic mock PDF URL
    const encodedContent = btoa(encodeURIComponent(content));
    return `data:application/pdf;base64,${encodedContent}`;
  }

  async optimizePdf(pdfUrl: string): Promise<string> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/pdf/optimize`,
        {
          source_url: pdfUrl,
          optimization_level: "high",
          compress_images: true,
          remove_metadata: false, // Keep metadata for tracking
        },
        {
          headers: {
            Authorization: `Bearer ${this.foxitApiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 30000
        }
      );

      await messageQueueService.sendNotification(
        "PDF optimized for faster download and sharing",
        "info"
      );

      return response.data.optimized_url || pdfUrl;
    } catch (error) {
      console.error("PDF optimization error:", error);
      await messageQueueService.sendNotification(
        "PDF optimization skipped, using original version",
        "warning"
      );
      return pdfUrl;
    }
  }

  downloadStyleGuide(content: string, filename: string): void {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}_${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Send download notification
    messageQueueService.sendNotification(
      `Style guide "${filename}" downloaded successfully`,
      "success"
    );
  }

  // Batch process multiple style guides
  async generateMultipleStyleGuides(
    aestheticVariations: AestheticAnalysis[],
    products: Product[]
  ): Promise<string[]> {
    const taskIds = await Promise.all(
      aestheticVariations.map((aesthetic) =>
        messageQueueService.addTask(`multi-guide:${aesthetic.style}`, "normal")
      )
    );

    // Process all style guides asynchronously
    const generationPromises = aestheticVariations.map(
      async (aesthetic, index) => {
        try {
          return await this.generateStyleGuide(aesthetic, products);
        } catch (error) {
          console.error(
            `Failed to generate guide for ${aesthetic.style}:`,
            error
          );
          return null;
        }
      }
    );

    const results = await Promise.all(generationPromises);
    const successfulResults = results.filter(
      (result) => result !== null
    ) as string[];

    await messageQueueService.sendNotification(
      `Generated ${successfulResults.length} of ${aestheticVariations.length} style guides`,
      successfulResults.length === aestheticVariations.length
        ? "success"
        : "warning"
    );

    return successfulResults;
  }
}

export const documentService = new DocumentGenerationService();
