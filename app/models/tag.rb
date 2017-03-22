# frozen_string_literal: true

class Tag < ApplicationRecord
  has_and_belongs_to_many :statuses

  HASHTAG_RE = /(?:^|[^\/\)\w])#([[:word:]_]*[[:alpha:]_][[:word:]_]*)/i

  validates :name, presence: true, uniqueness: true

  def to_param
    name
  end

  class << self
    def search_for(terms, limit = 5)
      textsearch = 'to_tsvector(\'simple\', tags.name)'
      query      = 'to_tsquery(\'simple\', \'\'\' \' || ? || \' \'\'\' || \':*\')'

      sql = <<SQL
        SELECT
          tags.*,
          ts_rank_cd(#{textsearch}, #{query}) AS rank
        FROM tags
        WHERE #{query} @@ #{textsearch}
        ORDER BY rank DESC
        LIMIT ?
SQL

      Tag.find_by_sql([sql, terms, terms, limit])
    end
  end
end
